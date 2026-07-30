import {
  Component, HostListener, Input, OnChanges, OnDestroy, OnInit,
  PLATFORM_ID, SimpleChanges, computed, inject, signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Tile {
  /** Stable id 0..n²-1; its solved (home) position. The last id is the blank. */
  id: number;
  /** Current grid location. */
  row: number;
  col: number;
  /** Home location, drives which slice of the photo the tile shows. */
  homeRow: number;
  homeCol: number;
}

@Component({
  selector: 'app-mosaic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mosaic w-full max-w-md mx-auto select-none">
      <!-- Stats bar -->
      <div class="flex items-center justify-between mb-3 text-sm font-semibold text-secondary-600 dark:text-secondary-300">
        <span>Moves: {{ moves() }}</span>
        <span>{{ formattedTime() }}</span>
        <button (click)="newGame()" class="btn btn-sm btn-secondary">Shuffle</button>
      </div>

      <!-- Board -->
      <div class="mosaic-board relative w-full rounded-xl overflow-hidden bg-secondary-200 dark:bg-secondary-700 shadow-lg"
           [class.mosaic-won]="status() === 'won'">
        @for (tile of tiles(); track tile.id) {
          <div class="mosaic-tile absolute"
               [class.cursor-pointer]="status() === 'playing'"
               [style.left.%]="tile.col * cellPercent()"
               [style.top.%]="tile.row * cellPercent()"
               [style.width.%]="cellPercent()"
               [style.height.%]="cellPercent()"
               [style.backgroundImage]="'url(' + imageUrl + ')'"
               [style.backgroundSize]="bgSize()"
               [style.backgroundPosition]="bgPosition(tile)"
               (click)="onTileClick(tile)">
          </div>
        }
        @if (status() === 'won') {
          <div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <div class="text-center px-4">
              <p class="text-2xl font-bold text-white drop-shadow mb-1">Solved! 🎉</p>
              <p class="text-white/90 text-sm">{{ moves() }} moves · {{ formattedTime() }}</p>
              <button (click)="newGame()" class="btn btn-primary btn-sm mt-3">Play again</button>
            </div>
          </div>
        }
      </div>

      <p class="text-center text-xs text-secondary-500 dark:text-secondary-400 mt-3">
        Use the arrow keys (or tap a tile next to the gap) to slide tiles into place.
      </p>
    </div>
  `,
  styles: [`
    .mosaic-board { aspect-ratio: 1 / 1; }
    .mosaic-tile {
      background-repeat: no-repeat;
      transition: left 0.14s ease, top 0.14s ease;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
    }
    /* When solved, drop the tile seams so the photo reads as whole. */
    .mosaic-won .mosaic-tile { box-shadow: none; }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-tile { transition: none; }
    }
  `]
})
export class MosaicComponent implements OnInit, OnChanges, OnDestroy {
  @Input() imageUrl = '';
  /** Tiles per side (3–5). */
  @Input() gridSize = 4;
  /** Reserved for parity with other mini-games; not currently persisted. */
  @Input() storageKey = '';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** board[position] = tile id currently occupying that position. */
  board = signal<number[]>([]);
  moves = signal(0);
  status = signal<'playing' | 'won'>('playing');
  elapsedMs = signal(0);

  private startedAt: number | null = null;
  private timer: any = null;

  private get size(): number {
    return Math.max(3, Math.min(5, this.gridSize || 4));
  }

  cellPercent = computed(() => 100 / this.size);
  bgSize = computed(() => {
    const pct = this.size * 100;
    return `${pct}% ${pct}%`;
  });

  /** Non-blank tiles (plus the blank once solved) with their current and home cells. */
  tiles = computed<Tile[]>(() => {
    const n = this.size;
    const total = n * n;
    const blankId = total - 1;
    const b = this.board();
    const showAll = this.status() === 'won';
    const out: Tile[] = [];
    for (let id = 0; id < total; id++) {
      if (id === blankId && !showAll) continue;
      const pos = b.indexOf(id);
      if (pos < 0) continue;
      out.push({
        id,
        row: Math.floor(pos / n),
        col: pos % n,
        homeRow: Math.floor(id / n),
        homeCol: id % n,
      });
    }
    return out;
  });

  formattedTime = computed(() => {
    const totalSeconds = Math.floor(this.elapsedMs() / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  bgPosition(tile: Tile): string {
    const n = this.size;
    if (n <= 1) return '0% 0%';
    const x = (tile.homeCol / (n - 1)) * 100;
    const y = (tile.homeRow / (n - 1)) * 100;
    return `${x}% ${y}%`;
  }

  ngOnInit(): void {
    this.newGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['imageUrl'] && !changes['imageUrl'].firstChange) ||
        (changes['gridSize'] && !changes['gridSize'].firstChange)) {
      this.newGame();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  newGame(): void {
    this.stopTimer();
    this.startedAt = null;
    this.elapsedMs.set(0);
    this.moves.set(0);
    this.status.set('playing');
    this.board.set(this.scramble());
  }

  // --- Scramble via random legal slides (always solvable) ---
  private scramble(): number[] {
    const n = this.size;
    const total = n * n;
    const arr = Array.from({ length: total }, (_, i) => i);
    let blank = total - 1;
    let last = -1;
    const steps = total * 40;
    for (let k = 0; k < steps; k++) {
      const br = Math.floor(blank / n);
      const bc = blank % n;
      const neighbors: number[] = [];
      if (br > 0) neighbors.push(blank - n);
      if (br < n - 1) neighbors.push(blank + n);
      if (bc > 0) neighbors.push(blank - 1);
      if (bc < n - 1) neighbors.push(blank + 1);
      const choices = neighbors.filter(p => p !== last);
      const pick = choices[Math.floor(Math.random() * choices.length)];
      [arr[blank], arr[pick]] = [arr[pick], arr[blank]];
      last = blank;
      blank = pick;
    }
    // Vanishingly rare, but never start already-solved.
    if (this.isSolved(arr)) return this.scramble();
    return arr;
  }

  private isSolved(b: number[]): boolean {
    return b.every((v, i) => v === i);
  }

  // --- Input ---
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.isBrowser || this.status() !== 'playing') return;
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const n = this.size;
    const blank = this.board().indexOf(n * n - 1);
    const br = Math.floor(blank / n);
    const bc = blank % n;
    let target_pos = -1;
    switch (event.key) {
      // Arrow direction = the direction the tile travels into the gap.
      case 'ArrowUp': if (br < n - 1) target_pos = blank + n; break;
      case 'ArrowDown': if (br > 0) target_pos = blank - n; break;
      case 'ArrowLeft': if (bc < n - 1) target_pos = blank + 1; break;
      case 'ArrowRight': if (bc > 0) target_pos = blank - 1; break;
      default: return;
    }
    event.preventDefault();
    if (target_pos >= 0) this.slide(target_pos);
  }

  onTileClick(tile: Tile): void {
    if (this.status() !== 'playing') return;
    const n = this.size;
    const pos = tile.row * n + tile.col;
    const blank = this.board().indexOf(n * n - 1);
    const br = Math.floor(blank / n);
    const bc = blank % n;
    const adjacent =
      (tile.row === br && Math.abs(tile.col - bc) === 1) ||
      (tile.col === bc && Math.abs(tile.row - br) === 1);
    if (adjacent) this.slide(pos);
  }

  private slide(targetPos: number): void {
    const n = this.size;
    const blank = this.board().indexOf(n * n - 1);
    const next = [...this.board()];
    [next[blank], next[targetPos]] = [next[targetPos], next[blank]];
    this.board.set(next);
    this.moves.update(m => m + 1);
    this.startTimer();
    if (this.isSolved(next)) {
      this.status.set('won');
      this.stopTimer();
    }
  }

  // --- Timer ---
  private startTimer(): void {
    if (!this.isBrowser || this.timer) return;
    this.startedAt = Date.now();
    this.timer = setInterval(() => {
      if (this.startedAt != null) this.elapsedMs.set(Date.now() - this.startedAt);
    }, 250);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.startedAt != null) {
      this.elapsedMs.set(Date.now() - this.startedAt);
    }
  }
}
