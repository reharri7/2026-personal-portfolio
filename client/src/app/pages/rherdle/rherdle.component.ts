import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RherdleComponent } from '../../components/rherdle/rherdle.component';
import { RherdleService, RherdleMeta } from '../../services/rherdle.service';

@Component({
  selector: 'app-rherdle-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RherdleComponent],
  template: `
    <div class="bg-white dark:bg-secondary-900 min-h-screen">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold mb-3 text-secondary-900 dark:text-white text-3d">Rherdle</h1>
          <p class="text-secondary-600 dark:text-secondary-400">
            The daily five-letter word game. One puzzle a day — six guesses.
          </p>
        </div>

        @if (meta()) {
          <app-rherdle
            mode="DAILY"
            [length]="meta()!.length"
            [maxGuesses]="meta()!.maxGuesses"
            [storageKey]="meta()!.puzzleDate" />
          <p class="text-center text-xs text-secondary-500 dark:text-secondary-400 mt-6">
            Puzzle for {{ meta()!.puzzleDate }}
          </p>
        } @else if (loading()) {
          <p class="text-center text-secondary-600 dark:text-secondary-400 py-12">Loading today's puzzle…</p>
        } @else {
          <div class="text-center py-12">
            <p class="text-secondary-600 dark:text-secondary-400">Couldn't load today's puzzle.</p>
            <a routerLink="/" class="btn btn-primary mt-4">Back home</a>
          </div>
        }
      </div>
    </div>
  `
})
export class RherdlePageComponent implements OnInit {
  private readonly rherdle = inject(RherdleService);

  meta = signal<RherdleMeta | undefined>(undefined);
  loading = signal(true);

  ngOnInit(): void {
    this.rherdle.getDailyMeta().subscribe({
      next: (meta) => { this.meta.set(meta); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }
}
