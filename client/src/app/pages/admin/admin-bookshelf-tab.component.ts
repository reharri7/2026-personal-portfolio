import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookService, Book, BookStatus } from '../../services/book.service';

interface BookForm {
  title: string;
  author: string;
  coverImageUrl: string;
  rating: number | null;
  review: string;
  hotTake: string;
  genre: string;
  pageCount: number | null;
  status: BookStatus;
  startedAt: string;
  finishedAt: string;
  sortOrder: number;
}

const EMPTY_FORM = (): BookForm => ({
  title: '', author: '', coverImageUrl: '', rating: null, review: '', hotTake: '',
  genre: '', pageCount: null, status: 'FINISHED', startedAt: '', finishedAt: '', sortOrder: 0,
});

@Component({
  selector: 'app-admin-bookshelf-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid lg:grid-cols-3 gap-12">
      <!-- Form -->
      <div class="lg:col-span-2">
        <div class="card">
          <h2 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">
            {{ editingId() ? 'Edit Book' : 'Add a Book' }}
          </h2>
          <form (ngSubmit)="save()" class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Title *</label>
                <input [(ngModel)]="form.title" name="title" required [class]="inputClass" placeholder="The Pragmatic Programmer" />
              </div>
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Author *</label>
                <input [(ngModel)]="form.author" name="author" required [class]="inputClass" placeholder="Hunt &amp; Thomas" />
              </div>
            </div>

            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Cover Image</label>
              <input type="file" accept="image/*" (change)="onCoverSelected($event)"
                class="block w-full text-sm text-secondary-700 dark:text-secondary-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700" />
              @if (form.coverImageUrl) {
                <div class="mt-2 flex items-center gap-3">
                  <img [src]="form.coverImageUrl" alt="Cover preview" class="h-28 rounded border border-secondary-200 dark:border-secondary-700" />
                  <button type="button" (click)="form.coverImageUrl = ''" class="text-sm text-red-600 hover:underline">Remove</button>
                </div>
              }
              @if (uploadState() === 'uploading') {
                <p class="text-sm text-secondary-600 dark:text-secondary-300 mt-2">Uploading…</p>
              } @else if (uploadState() === 'error') {
                <p class="text-sm text-red-600 dark:text-red-400 mt-2">✕ {{ uploadError() }}</p>
              }
            </div>

            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Status</label>
                <select [(ngModel)]="form.status" name="status" [class]="inputClass">
                  <option value="FINISHED">Finished</option>
                  <option value="READING">Currently reading</option>
                  <option value="DNF">Did not finish</option>
                </select>
              </div>
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Rating</label>
                <select [ngModel]="form.rating" (ngModelChange)="form.rating = $event === null ? null : +$event" name="rating" [class]="inputClass">
                  <option [ngValue]="null">No rating</option>
                  @for (r of ratingOptions; track r) {
                    <option [ngValue]="r">{{ r }} ★</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Genre</label>
                <input [(ngModel)]="form.genre" name="genre" [class]="inputClass" placeholder="Sci-Fi" />
              </div>
            </div>

            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Pages</label>
                <input type="number" min="0" [(ngModel)]="form.pageCount" name="pageCount" [class]="inputClass" placeholder="352" />
              </div>
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Started</label>
                <input type="date" [(ngModel)]="form.startedAt" name="startedAt" [class]="inputClass" />
              </div>
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Finished</label>
                <input type="date" [(ngModel)]="form.finishedAt" name="finishedAt" [class]="inputClass" />
              </div>
            </div>

            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Hot take (one-liner)</label>
              <input [(ngModel)]="form.hotTake" name="hotTake" maxlength="500" [class]="inputClass" placeholder="Changed how I write code. No notes." />
            </div>

            <div>
              <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Review</label>
              <textarea [(ngModel)]="form.review" name="review" rows="4" [class]="inputClass" placeholder="Longer thoughts…"></textarea>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-secondary-700 dark:text-secondary-300 font-semibold mb-2">Sort order</label>
                <input type="number" [(ngModel)]="form.sortOrder" name="sortOrder" [class]="inputClass" />
                <p class="text-xs text-secondary-500 mt-1">Lower sorts first within a shelf (ties broken after date).</p>
              </div>
            </div>

            @if (error()) { <p class="text-sm text-red-600 dark:text-red-400">{{ error() }}</p> }
            @if (success()) { <p class="text-sm text-green-600 dark:text-green-400">{{ success() }}</p> }

            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving…' : (editingId() ? 'Update Book' : 'Add Book') }}
              </button>
              <button type="button" (click)="reset()" class="btn btn-secondary" [disabled]="saving()">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- List -->
      <div class="lg:col-span-1">
        <div class="card">
          <h2 class="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">Books ({{ books().length }})</h2>
          <div class="space-y-3 max-h-[36rem] overflow-y-auto">
            @for (book of books(); track book.id) {
              <div class="p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg flex gap-3"
                   [class.opacity-50]="deletingId() === book.id">
                <div class="w-10 shrink-0">
                  @if (book.coverImageUrl) {
                    <img [src]="book.coverImageUrl" [alt]="book.title" class="w-10 aspect-[2/3] object-cover rounded" />
                  } @else {
                    <div class="w-10 aspect-[2/3] rounded bg-secondary-200 dark:bg-secondary-700"></div>
                  }
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-secondary-900 dark:text-white truncate text-sm">{{ book.title }}</h3>
                  <p class="text-xs text-secondary-500 dark:text-secondary-400 truncate">{{ book.author }}</p>
                  <p class="text-xs mt-0.5">
                    <span class="uppercase tracking-wide"
                      [class.text-green-600]="book.status === 'FINISHED'"
                      [class.text-primary-600]="book.status === 'READING'"
                      [class.text-secondary-500]="book.status === 'DNF'">{{ book.status }}</span>
                    @if (book.rating != null) { <span class="text-amber-500"> · {{ book.rating }}★</span> }
                  </p>
                  <div class="flex gap-2 mt-1">
                    <button (click)="edit(book)" [disabled]="deletingId() === book.id" class="btn btn-sm btn-primary">Edit</button>
                    <button (click)="remove(book.id)" [disabled]="deletingId() === book.id" class="btn btn-sm btn-error">
                      {{ deletingId() === book.id ? 'Deleting…' : 'Delete' }}
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <p class="text-center py-8 text-secondary-500 dark:text-secondary-400">No books yet</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminBookshelfTabComponent implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly http = inject(HttpClient);

  readonly inputClass = 'w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500';
  readonly ratingOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  books = signal<Book[]>([]);
  form: BookForm = EMPTY_FORM();
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
    this.bookService.getAll().subscribe({
      next: (b) => this.books.set(b),
      error: (e) => this.error.set(this.extract(e)),
    });
  }

  save(): void {
    if (!this.form.title.trim() || !this.form.author.trim()) {
      this.error.set('Title and author are required.');
      return;
    }
    this.error.set('');
    this.success.set('');
    this.saving.set(true);

    const payload: Partial<Book> = {
      title: this.form.title.trim(),
      author: this.form.author.trim(),
      coverImageUrl: this.form.coverImageUrl || null,
      rating: this.form.rating,
      review: this.form.review || null,
      hotTake: this.form.hotTake || null,
      genre: this.form.genre || null,
      pageCount: this.form.pageCount,
      status: this.form.status,
      startedAt: this.form.startedAt || null,
      finishedAt: this.form.finishedAt || null,
      sortOrder: this.form.sortOrder ?? 0,
    };

    const id = this.editingId();
    const req$ = id != null ? this.bookService.update(id, payload) : this.bookService.create(payload);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(id != null ? 'Book updated' : 'Book added');
        this.reset();
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(this.extract(e));
      },
    });
  }

  edit(book: Book): void {
    this.editingId.set(book.id);
    this.error.set('');
    this.success.set('');
    this.form = {
      title: book.title,
      author: book.author,
      coverImageUrl: book.coverImageUrl ?? '',
      rating: book.rating ?? null,
      review: book.review ?? '',
      hotTake: book.hotTake ?? '',
      genre: book.genre ?? '',
      pageCount: book.pageCount ?? null,
      status: book.status,
      startedAt: book.startedAt ?? '',
      finishedAt: book.finishedAt ?? '',
      sortOrder: book.sortOrder ?? 0,
    };
  }

  remove(id: number): void {
    if (!confirm('Delete this book?')) return;
    this.deletingId.set(id);
    this.bookService.delete(id).subscribe({
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

  onCoverSelected(event: Event): void {
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
          this.form.coverImageUrl = url;
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
