import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MosaicComponent } from '../../components/mosaic/mosaic.component';
import { MosaicService, MosaicPuzzle } from '../../services/mosaic.service';

@Component({
  selector: 'app-mosaic-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MosaicComponent],
  template: `
    <div class="bg-white dark:bg-secondary-900 min-h-screen">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold mb-3 text-secondary-900 dark:text-white text-3d">Mosaic</h1>
          <p class="text-secondary-600 dark:text-secondary-400">
            Slide the tiles to unscramble the photo.
          </p>
        </div>

        @if (selected(); as puzzle) {
          <div class="mb-6 text-center">
            <button (click)="back()" class="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              ← All puzzles
            </button>
            <h2 class="text-2xl font-bold mt-2 text-secondary-900 dark:text-white">{{ puzzle.title }}</h2>
          </div>
          <app-mosaic [imageUrl]="puzzle.imageUrl" [gridSize]="puzzle.gridSize" [storageKey]="puzzle.slug" />
        } @else if (loading()) {
          <p class="text-center text-secondary-600 dark:text-secondary-400 py-12">Loading puzzles…</p>
        } @else if (puzzles().length === 0) {
          <div class="text-center py-12">
            <p class="text-secondary-600 dark:text-secondary-400">No puzzles yet — check back soon!</p>
            <a routerLink="/" class="btn btn-primary mt-4">Back home</a>
          </div>
        } @else {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (puzzle of puzzles(); track puzzle.id) {
              <button (click)="select(puzzle)"
                      class="group text-left rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 hover:shadow-lg transition-shadow">
                <div class="aspect-square overflow-hidden bg-secondary-200 dark:bg-secondary-700">
                  <img [src]="puzzle.imageUrl" [alt]="puzzle.title"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div class="p-3 flex items-center justify-between">
                  <span class="font-semibold text-secondary-900 dark:text-white truncate">{{ puzzle.title }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200">
                    {{ puzzle.gridSize }}×{{ puzzle.gridSize }}
                  </span>
                </div>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class MosaicPageComponent implements OnInit {
  private readonly mosaic = inject(MosaicService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  puzzles = signal<MosaicPuzzle[]>([]);
  selected = signal<MosaicPuzzle | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.mosaic.getPublished().subscribe({
      next: (list) => {
        this.puzzles.set(list);
        this.loading.set(false);
        if (slug) {
          const match = list.find(p => p.slug === slug);
          if (match) this.selected.set(match);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  select(puzzle: MosaicPuzzle): void {
    this.selected.set(puzzle);
    this.router.navigate(['/fun/mosaic', puzzle.slug]);
  }

  back(): void {
    this.selected.set(null);
    this.router.navigate(['/fun/mosaic']);
  }
}
