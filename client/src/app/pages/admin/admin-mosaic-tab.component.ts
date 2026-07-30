import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MosaicService, MosaicPuzzle } from '../../services/mosaic.service';

interface MosaicForm {
  title: string;
  imageUrl: string;
  gridSize: number;
  published: boolean;
}

const EMPTY_FORM = (): MosaicForm => ({
  title: '', imageUrl: '', gridSize: 4, published: true,
});

@Component({
  selector: 'app-admin-mosaic-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid lg:grid-cols-3 gap-12">
      <!-- Form -->
      <div class="lg:col-span-2">
        <div class="card">
          <h2 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">
            {{ editingId() ? 'Edit Puzzle' : 'Add a Puzzle' }}
          </h2>
          <form (ngSubmit)="save()" class="space-y-4">
            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Title *</label>
              <input [(ngModel)]="form.title" name="title" required [class]="inputClass" placeholder="Sunset over the bay" />
            </div>

            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Photo *</label>
              <input type="file" accept="image/*" (change)="onImageSelected($event)"
                class="block w-full text-sm text-secondary-700 dark:text-secondary-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700" />
              @if (form.imageUrl) {
                <div class="mt-2 flex items-center gap-3">
                  <img [src]="form.imageUrl" alt="Puzzle preview" class="h-28 w-28 object-cover rounded border border-secondary-200 dark:border-secondary-700" />
                  <button type="button" (click)="form.imageUrl = ''" class="text-sm text-red-600 hover:underline">Remove</button>
                </div>
              }
              @if (uploadState() === 'uploading') {
                <p class="text-sm text-secondary-600 dark:text-secondary-300 mt-2">Uploading…</p>
              } @else if (uploadState() === 'error') {
                <p class="text-sm text-red-600 dark:text-red-400 mt-2">✕ {{ uploadError() }}</p>
              }
              <p class="text-xs text-secondary-500 mt-1">A square-ish photo works best — it's cropped to a square in the game.</p>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Difficulty</label>
                <select [ngModel]="form.gridSize" (ngModelChange)="form.gridSize = +$event" name="gridSize" [class]="inputClass">
                  <option [ngValue]="3">Easy (3×3)</option>
                  <option [ngValue]="4">Medium (4×4)</option>
                  <option [ngValue]="5">Hard (5×5)</option>
                </select>
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center">
                  <input [(ngModel)]="form.published" name="published" type="checkbox" class="w-4 h-4 text-primary-600 dark:text-primary-500" />
                  <span class="ml-2 text-secondary-700 dark:text-secondary-300">Published (shown on /fun/mosaic)</span>
                </label>
              </div>
            </div>

            @if (error()) { <p class="text-sm text-red-600 dark:text-red-400">{{ error() }}</p> }
            @if (success()) { <p class="text-sm text-green-600 dark:text-green-400">{{ success() }}</p> }

            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving…' : (editingId() ? 'Update Puzzle' : 'Add Puzzle') }}
              </button>
              <button type="button" (click)="reset()" class="btn btn-secondary" [disabled]="saving()">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- List -->
      <div class="lg:col-span-1">
        <div class="card">
          <h2 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">Puzzles ({{ puzzles().length }})</h2>
          <div class="space-y-3 max-h-[36rem] overflow-y-auto">
            @for (puzzle of puzzles(); track puzzle.id) {
              <div class="p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg flex gap-3"
                   [class.opacity-50]="deletingId() === puzzle.id">
                <img [src]="puzzle.imageUrl" [alt]="puzzle.title" class="w-12 h-12 object-cover rounded shrink-0" />
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-secondary-900 dark:text-white truncate text-sm">{{ puzzle.title }}</h3>
                  <p class="text-xs text-secondary-500 dark:text-secondary-400">
                    {{ puzzle.gridSize }}×{{ puzzle.gridSize }}
                    <span [class.text-green-600]="puzzle.published" [class.text-secondary-500]="!puzzle.published">
                      · {{ puzzle.published ? 'Published' : 'Hidden' }}
                    </span>
                  </p>
                  <div class="flex gap-2 mt-1">
                    <button (click)="edit(puzzle)" [disabled]="deletingId() === puzzle.id" class="btn btn-sm btn-primary">Edit</button>
                    <button (click)="remove(puzzle.id)" [disabled]="deletingId() === puzzle.id" class="btn btn-sm btn-error">
                      {{ deletingId() === puzzle.id ? 'Deleting…' : 'Delete' }}
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <p class="text-center py-8 text-secondary-500 dark:text-secondary-400">No puzzles yet</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminMosaicTabComponent implements OnInit {
  private readonly mosaicService = inject(MosaicService);
  private readonly http = inject(HttpClient);

  readonly inputClass = 'w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500';

  puzzles = signal<MosaicPuzzle[]>([]);
  form: MosaicForm = EMPTY_FORM();
  editingId = signal<number | null>(null);
  saving = signal(false);
  deletingId = signal<number | null>(null);
  error = signal('');
  success = signal('');
  uploadState = signal<'idle' | 'uploading' | 'error'>('idle');
  uploadError = signal('');

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.mosaicService.getAll().subscribe({
      next: (p) => this.puzzles.set(p),
      error: (e) => this.error.set(this.extract(e)),
    });
  }

  save(): void {
    if (!this.form.title.trim()) {
      this.error.set('Title is required.');
      return;
    }
    if (!this.form.imageUrl) {
      this.error.set('Please upload a photo.');
      return;
    }
    this.error.set('');
    this.success.set('');
    this.saving.set(true);

    const payload: Partial<MosaicPuzzle> = {
      title: this.form.title.trim(),
      imageUrl: this.form.imageUrl,
      gridSize: this.form.gridSize,
      published: this.form.published,
    };

    const id = this.editingId();
    const req$ = id != null ? this.mosaicService.update(id, payload) : this.mosaicService.create(payload);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(id != null ? 'Puzzle updated' : 'Puzzle added');
        this.reset();
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(this.extract(e));
      },
    });
  }

  edit(puzzle: MosaicPuzzle): void {
    this.editingId.set(puzzle.id);
    this.error.set('');
    this.success.set('');
    this.form = {
      title: puzzle.title,
      imageUrl: puzzle.imageUrl,
      gridSize: puzzle.gridSize,
      published: puzzle.published ?? true,
    };
  }

  remove(id: number): void {
    if (!confirm('Delete this puzzle?')) return;
    this.deletingId.set(id);
    this.mosaicService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        if (this.editingId() === id) this.reset();
        this.load();
      },
      error: (e) => {
        this.deletingId.set(null);
        this.error.set(this.extract(e));
      },
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.form = EMPTY_FORM();
    this.uploadState.set('idle');
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadState.set('uploading');
    this.uploadError.set('');
    const fd = new FormData();
    fd.append('file', file);
    this.http.post<{ url: string }>(`${environment.apiUrl}/admin/uploads/image`, fd)
      .pipe(map(r => r.url))
      .subscribe({
        next: (url) => {
          this.form.imageUrl = url;
          this.uploadState.set('idle');
          input.value = '';
        },
        error: (e) => {
          this.uploadState.set('error');
          this.uploadError.set(this.extract(e));
          input.value = '';
        },
      });
  }

  private extract(err: any): string {
    return err?.error?.error ?? err?.error?.message ?? err?.message ?? 'Unknown error';
  }
}
