import {
  Component, OnInit, signal, computed, inject, PLATFORM_ID, Input, HostListener, WritableSignal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BookService, Book, BookStats } from '../../services/book.service';

/**
 * Renders a 0–5 rating as filled book icons, with arbitrary fractional fill
 * (so half stars look like half-filled books). Two stacked layers — a grey
 * base and an amber overlay clipped to `rating / 5` width.
 */
@Component({
  selector: 'app-book-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (rating != null) {
      <div class="relative inline-flex select-none" [attr.aria-label]="rating + ' out of 5'" [class]="sizeClass">
        <div class="flex gap-0.5 text-secondary-300 dark:text-secondary-600">
          @for (i of icons; track i) {
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-[1em] h-[1em]"><path d="M3 4.5C4.3 4 6 3.7 7.5 3.7c1.9 0 3.6.4 4.5 1.1.9-.7 2.6-1.1 4.5-1.1 1.5 0 3.2.3 4.5.8v14c-1.3-.5-3-.8-4.5-.8-1.9 0-3.6.4-4.5 1.1-.9-.7-2.6-1.1-4.5-1.1-1.5 0-3.2.3-4.5.8v-14zM12 6.3v11"/></svg>
          }
        </div>
        <div class="flex gap-0.5 text-amber-500 absolute inset-0 overflow-hidden" [style.width.%]="rating / 5 * 100">
          @for (i of icons; track i) {
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-[1em] h-[1em] shrink-0"><path d="M3 4.5C4.3 4 6 3.7 7.5 3.7c1.9 0 3.6.4 4.5 1.1.9-.7 2.6-1.1 4.5-1.1 1.5 0 3.2.3 4.5.8v14c-1.3-.5-3-.8-4.5-.8-1.9 0-3.6.4-4.5 1.1-.9-.7-2.6-1.1-4.5-1.1-1.5 0-3.2.3-4.5.8v-14zM12 6.3v11"/></svg>
          }
        </div>
      </div>
    }
  `,
})
export class BookRatingComponent {
  @Input() rating: number | null | undefined = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  readonly icons = [0, 1, 2, 3, 4];
  get sizeClass(): string {
    return this.size === 'lg' ? 'text-2xl' : this.size === 'sm' ? 'text-sm' : 'text-lg';
  }
}

type SortKey = 'recent' | 'rating' | 'title';

@Component({
  selector: 'app-bookshelf',
  standalone: true,
  imports: [CommonModule, FormsModule, BookRatingComponent],
  template: `
    <div class="bg-white dark:bg-secondary-900 min-h-screen">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        <!-- Header -->
        <div class="mb-10 text-center">
          <h1 class="text-4xl sm:text-5xl font-bold text-secondary-900 dark:text-white">📚 The Bookshelf</h1>
          <p class="mt-3 text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
            Everything I've read, rated, and occasionally ranted about. Hover the covers, judge my taste.
          </p>
        </div>

        <!-- Stats banner -->
        @if (stats(); as s) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-14">
            <div class="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white p-4 sm:p-5 shadow-lg">
              <div class="text-3xl sm:text-4xl font-extrabold tabular-nums">{{ animBooksYear() }}</div>
              <div class="text-xs sm:text-sm opacity-90 mt-1">books in {{ currentYear }}</div>
            </div>
            <div class="rounded-2xl bg-secondary-100 dark:bg-secondary-800 p-4 sm:p-5 shadow-sm">
              <div class="text-3xl sm:text-4xl font-extrabold tabular-nums text-secondary-900 dark:text-white">{{ animPagesYear() | number }}</div>
              <div class="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 mt-1">pages devoured this year</div>
            </div>
            <div class="rounded-2xl bg-secondary-100 dark:bg-secondary-800 p-4 sm:p-5 shadow-sm">
              <div class="text-3xl sm:text-4xl font-extrabold tabular-nums text-secondary-900 dark:text-white">{{ animTotal() }}</div>
              <div class="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 mt-1">books all-time</div>
            </div>
            <div class="rounded-2xl bg-secondary-100 dark:bg-secondary-800 p-4 sm:p-5 shadow-sm flex flex-col justify-center">
              <div class="flex items-center gap-2">
                <span class="text-2xl sm:text-3xl font-extrabold tabular-nums text-secondary-900 dark:text-white">{{ s.averageRating ?? '–' }}</span>
                <app-book-rating [rating]="s.averageRating" size="sm" />
              </div>
              <div class="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 mt-1">average rating</div>
            </div>
            <div class="rounded-2xl bg-secondary-100 dark:bg-secondary-800 p-4 sm:p-5 shadow-sm flex flex-col justify-center">
              <div class="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white truncate">{{ s.favoriteGenre || '—' }}</div>
              <div class="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 mt-1">most-read genre</div>
            </div>
          </div>
        }

        <!-- On my nightstand -->
        @if (reading().length > 0) {
          <section class="mb-16">
            <h2 class="text-2xl font-bold text-secondary-900 dark:text-white mb-1">🛏️ On my nightstand</h2>
            <p class="text-secondary-500 dark:text-secondary-400 text-sm mb-5">What I'm reading right now.</p>
            <div class="flex gap-6 overflow-x-auto pb-4">
              @for (book of reading(); track book.id; let i = $index) {
                <button class="book-enter group relative shrink-0 w-40 text-left" [style.animation-delay.ms]="i * 60" (click)="open(book)">
                  <div class="relative">
                    <span class="absolute -top-2 -right-2 z-10 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">READING</span>
                    <ng-container [ngTemplateOutlet]="cover" [ngTemplateOutletContext]="{ $implicit: book, big: true }" />
                  </div>
                  <h3 class="mt-3 font-semibold text-secondary-900 dark:text-white text-sm leading-tight line-clamp-2">{{ book.title }}</h3>
                  <p class="text-xs text-secondary-500 dark:text-secondary-400">{{ book.author }}</p>
                </button>
              }
            </div>
          </section>
        }

        <!-- Filters -->
        <section class="mb-8">
          <h2 class="text-2xl font-bold text-secondary-900 dark:text-white mb-5">✅ Read &amp; rated</h2>
          <div class="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            <input
              type="search"
              [(ngModel)]="search"
              (ngModelChange)="search.set($event)"
              placeholder="Search title or author…"
              class="w-full lg:w-72 px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div class="flex flex-wrap items-center gap-2">
              <button
                (click)="genre.set('')"
                [class]="chipClass(genre() === '')">All genres</button>
              @for (g of genres(); track g) {
                <button (click)="genre.set(g)" [class]="chipClass(genre() === g)">{{ g }}</button>
              }
            </div>
            <div class="flex items-center gap-2 lg:ml-auto">
              <label class="text-sm text-secondary-500 dark:text-secondary-400">Min ★</label>
              <select [ngModel]="minRating()" (ngModelChange)="minRating.set(+$event)"
                class="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm">
                <option [value]="0">Any</option>
                <option [value]="3">3+</option>
                <option [value]="4">4+</option>
                <option [value]="4.5">4.5+</option>
              </select>
              <label class="text-sm text-secondary-500 dark:text-secondary-400 ml-2">Sort</label>
              <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)"
                class="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm">
                <option value="recent">Recently read</option>
                <option value="rating">Highest rated</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
          </div>

          @if (loading()) {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
              @for (n of [1,2,3,4,5,6,7,8,9,10]; track n) {
                <div class="animate-pulse">
                  <div class="aspect-[2/3] rounded-lg bg-secondary-200 dark:bg-secondary-700"></div>
                  <div class="h-3 bg-secondary-200 dark:bg-secondary-700 rounded mt-3 w-3/4"></div>
                  <div class="h-2 bg-secondary-200 dark:bg-secondary-700 rounded mt-2 w-1/2"></div>
                </div>
              }
            </div>
          } @else if (filteredBooks().length === 0) {
            <div class="text-center py-16 text-secondary-500 dark:text-secondary-400">
              No books match those filters.
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10" style="perspective: 1000px;">
              @for (book of filteredBooks(); track book.id; let i = $index) {
                <button class="book-enter group text-left" [style.animation-delay.ms]="i * 35" (click)="open(book)">
                  <div class="relative transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:[transform:rotateY(-8deg)_translateY(-0.5rem)]">
                    <ng-container [ngTemplateOutlet]="cover" [ngTemplateOutletContext]="{ $implicit: book, big: false }" />
                  </div>
                  <h3 class="mt-3 font-semibold text-secondary-900 dark:text-white text-sm leading-tight line-clamp-2">{{ book.title }}</h3>
                  <p class="text-xs text-secondary-500 dark:text-secondary-400 mb-1">{{ book.author }}</p>
                  <app-book-rating [rating]="book.rating" size="sm" />
                  @if (book.hotTake) {
                    <p class="text-xs italic text-secondary-600 dark:text-secondary-300 mt-1 line-clamp-2">“{{ book.hotTake }}”</p>
                  }
                </button>
              }
            </div>
          }
        </section>

        <!-- Abandoned shelf -->
        @if (abandoned().length > 0) {
          <section class="mt-20 pt-10 border-t border-dashed border-secondary-300 dark:border-secondary-700">
            <h2 class="text-2xl font-bold text-secondary-900 dark:text-white mb-1">🪦 The Abandoned Shelf</h2>
            <p class="text-secondary-500 dark:text-secondary-400 text-sm mb-6">Books I didn't finish. No regrets, mostly.</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
              @for (book of abandoned(); track book.id; let i = $index) {
                <button class="book-enter group text-left" [style.animation-delay.ms]="i * 35" (click)="open(book)">
                  <div class="relative transition-transform duration-300 group-hover:-translate-y-1">
                    <div class="opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition">
                      <ng-container [ngTemplateOutlet]="cover" [ngTemplateOutletContext]="{ $implicit: book, big: false }" />
                    </div>
                    <span class="absolute top-2 left-2 bg-secondary-900/80 text-white text-[10px] font-bold px-2 py-1 rounded">DNF</span>
                  </div>
                  <h3 class="mt-3 font-semibold text-secondary-900 dark:text-white text-sm leading-tight line-clamp-2">{{ book.title }}</h3>
                  <p class="text-xs text-secondary-500 dark:text-secondary-400">{{ book.author }}</p>
                  @if (book.hotTake) {
                    <p class="text-xs italic text-secondary-600 dark:text-secondary-300 mt-1 line-clamp-2">“{{ book.hotTake }}”</p>
                  }
                </button>
              }
            </div>
          </section>
        }
      </div>
    </div>

    <!-- Reusable cover template -->
    <ng-template #cover let-book let-big="big">
      @if (book.coverImageUrl) {
        <img [src]="book.coverImageUrl" [alt]="book.title + ' cover'" loading="lazy"
             class="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:shadow-2xl transition-shadow" />
      } @else {
        <div class="w-full aspect-[2/3] rounded-lg shadow-md group-hover:shadow-2xl transition-shadow flex flex-col items-center justify-center text-center p-3 bg-gradient-to-br from-primary-500 to-secondary-700 text-white">
          <span class="font-bold leading-tight" [class.text-lg]="big" [class.text-sm]="!big">{{ book.title }}</span>
          <span class="mt-2 text-xs opacity-80">{{ book.author }}</span>
        </div>
      }
    </ng-template>

    <!-- Detail modal -->
    @if (selected(); as book) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="close()">
        <div class="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex flex-col sm:flex-row gap-6 p-6">
            <div class="shrink-0 mx-auto sm:mx-0 w-40">
              <ng-container [ngTemplateOutlet]="cover" [ngTemplateOutletContext]="{ $implicit: book, big: true }" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <h3 class="text-2xl font-bold text-secondary-900 dark:text-white">{{ book.title }}</h3>
                <button (click)="close()" class="text-secondary-400 hover:text-secondary-700 dark:hover:text-white text-2xl leading-none">&times;</button>
              </div>
              <p class="text-secondary-500 dark:text-secondary-400">{{ book.author }}</p>

              <div class="mt-3 flex flex-wrap items-center gap-3">
                <app-book-rating [rating]="book.rating" size="lg" />
                @if (book.status === 'DNF') {
                  <span class="bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 text-xs font-bold px-2 py-1 rounded">DID NOT FINISH</span>
                } @else if (book.status === 'READING') {
                  <span class="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-bold px-2 py-1 rounded">CURRENTLY READING</span>
                }
              </div>

              <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary-500 dark:text-secondary-400">
                @if (book.genre) { <span>📖 {{ book.genre }}</span> }
                @if (book.pageCount) { <span>📄 {{ book.pageCount | number }} pages</span> }
                @if (book.finishedAt) { <span>✓ finished {{ book.finishedAt }}</span> }
                @else if (book.startedAt) { <span>▶ started {{ book.startedAt }}</span> }
              </div>

              @if (book.hotTake) {
                <p class="mt-4 text-base italic text-secondary-700 dark:text-secondary-200 border-l-4 border-primary-500 pl-3">“{{ book.hotTake }}”</p>
              }
              @if (book.review) {
                <p class="mt-4 text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap leading-relaxed">{{ book.review }}</p>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes bookEnter {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .book-enter {
      opacity: 0;
      animation: bookEnter 0.5s ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .book-enter { animation: none; opacity: 1; }
    }
  `],
})
export class BookshelfComponent implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly currentYear = new Date().getFullYear();

  loading = signal(true);
  reading = this.bookService.reading;
  abandoned = this.bookService.abandoned;
  stats = this.bookService.stats;
  private readonly allFinished = this.bookService.finished;

  selected = signal<Book | null>(null);

  // Filters
  search = signal('');
  genre = signal('');
  minRating = signal(0);
  sortBy = signal<SortKey>('recent');

  // Animated stat counters
  animBooksYear = signal(0);
  animPagesYear = signal(0);
  animTotal = signal(0);

  genres = computed(() => {
    const set = new Set<string>();
    for (const b of this.allFinished()) {
      if (b.genre) set.add(b.genre);
    }
    return Array.from(set).sort();
  });

  filteredBooks = computed(() => {
    const term = this.search().trim().toLowerCase();
    const g = this.genre();
    const min = this.minRating();
    const sort = this.sortBy();

    let books = this.allFinished().filter(b => {
      if (g && b.genre !== g) return false;
      if (min && (b.rating ?? 0) < min) return false;
      if (term && !(`${b.title} ${b.author}`.toLowerCase().includes(term))) return false;
      return true;
    });

    books = [...books];
    if (sort === 'rating') {
      books.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === 'title') {
      books.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      books.sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
    }
    return books;
  });

  chipClass(active: boolean): string {
    return active
      ? 'px-3 py-1.5 rounded-full text-sm bg-primary-600 text-white'
      : 'px-3 py-1.5 rounded-full text-sm bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700';
  }

  ngOnInit(): void {
    forkJoin({
      finished: this.bookService.loadFinished(),
      reading: this.bookService.loadReading(),
      abandoned: this.bookService.loadAbandoned(),
      stats: this.bookService.loadStats(),
    }).subscribe({
      next: ({ stats }) => {
        this.loading.set(false);
        this.animateStats(stats);
      },
      error: () => this.loading.set(false),
    });
  }

  open(book: Book): void {
    this.selected.set(book);
  }

  close(): void {
    this.selected.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.close();
  }

  private animateStats(stats: BookStats): void {
    if (!this.isBrowser) {
      this.animBooksYear.set(stats.booksThisYear);
      this.animPagesYear.set(stats.pagesThisYear);
      this.animTotal.set(stats.totalBooks);
      return;
    }
    this.tween(stats.booksThisYear, this.animBooksYear);
    this.tween(stats.pagesThisYear, this.animPagesYear);
    this.tween(stats.totalBooks, this.animTotal);
  }

  private tween(target: number, out: WritableSignal<number>, duration = 900): void {
    if (target <= 0) { out.set(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      out.set(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
