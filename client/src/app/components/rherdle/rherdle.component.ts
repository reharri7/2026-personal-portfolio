import {
  Component, HostListener, Input, OnInit, PLATFORM_ID,
  computed, inject, signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RherdleService, TileStatus } from '../../services/rherdle.service';

interface SubmittedGuess {
  letters: string[];
  statuses: TileStatus[];
}

interface SavedState {
  guesses: SubmittedGuess[];
  status: 'playing' | 'won' | 'lost';
  answer: string | null;
}

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

@Component({
  selector: 'app-rherdle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rherdle block w-full max-w-sm mx-auto select-none">
      <!-- Message banner -->
      <div class="h-8 flex items-center justify-center mb-2">
        @if (message()) {
          <span class="px-3 py-1 rounded-md text-sm font-semibold bg-secondary-800 text-white dark:bg-secondary-200 dark:text-secondary-900">
            {{ message() }}
          </span>
        }
      </div>

      <!-- Board -->
      <div class="flex flex-col gap-1.5 mb-5">
        @for (row of board(); track $index; let r = $index) {
          <div class="flex justify-center gap-1.5"
               [class.rherdle-shake]="shakeRow() === r">
            @for (cell of row; track $index; let c = $index) {
              <div
                class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-2xl font-bold uppercase rounded-md border-2 transition-colors"
                [class.rherdle-flip]="animateRow() === r"
                [style.animation-delay.ms]="animateRow() === r ? c * 250 : 0"
                [ngClass]="tileClass(cell.status, cell.letter)">
                {{ cell.letter }}
              </div>
            }
          </div>
        }
      </div>

      <!-- Win / lose footer -->
      @if (status() !== 'playing') {
        <div class="text-center mb-4">
          @if (status() === 'won') {
            <p class="text-lg font-bold text-green-600 dark:text-green-400">You got it! 🎉</p>
          } @else {
            <p class="text-lg font-bold text-secondary-700 dark:text-secondary-300">Out of guesses — better luck next time!</p>
          }
          <button (click)="share()"
                  class="btn btn-primary btn-sm mt-3">
            {{ shared() ? 'Copied!' : 'Share result' }}
          </button>
        </div>
      }

      <!-- On-screen keyboard -->
      <div class="flex flex-col gap-1.5">
        @for (kr of keyRows; track $index; let last = $last) {
          <div class="flex justify-center gap-1">
            @if (last) {
              <button class="rherdle-key px-2 grow-0 basis-12 text-xs font-bold"
                      [disabled]="status() !== 'playing'"
                      (click)="onKey('enter')">ENTER</button>
            }
            @for (k of kr; track $index) {
              <button class="rherdle-key flex-1 font-semibold uppercase"
                      [disabled]="status() !== 'playing'"
                      [ngClass]="keyClass(k)"
                      (click)="onKey(k)">{{ k }}</button>
            }
            @if (last) {
              <button class="rherdle-key px-2 grow-0 basis-12 text-lg"
                      [disabled]="status() !== 'playing'"
                      (click)="onKey('backspace')">⌫</button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .rherdle-key {
      height: 3.25rem;
      min-width: 1.75rem;
      border-radius: 0.375rem;
      background: rgb(226 232 240);
      color: rgb(15 23 42);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host-context(.dark) .rherdle-key { background: rgb(51 65 85); color: white; }
    .rherdle-key:active { transform: scale(0.95); }
    .rherdle-key:disabled { opacity: 0.9; cursor: default; }

    @keyframes rherdle-flip {
      0% { transform: rotateX(0); }
      50% { transform: rotateX(90deg); }
      100% { transform: rotateX(0); }
    }
    .rherdle-flip { animation: rherdle-flip 0.5s ease forwards; }

    @keyframes rherdle-shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .rherdle-shake { animation: rherdle-shake 0.4s ease; }

    @media (prefers-reduced-motion: reduce) {
      .rherdle-flip, .rherdle-shake { animation: none; }
    }
  `]
})
export class RherdleComponent implements OnInit {
  @Input() mode: 'DAILY' | 'BLOG' = 'DAILY';
  @Input() slug?: string;
  @Input() length = 5;
  @Input() maxGuesses = 6;
  /** Stable key used for localStorage persistence (puzzle date for daily, slug for blog). */
  @Input() storageKey = '';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly rherdle = inject(RherdleService);

  readonly keyRows = KEY_ROWS.map(r => r.split(''));

  guesses = signal<SubmittedGuess[]>([]);
  currentGuess = signal<string>('');
  status = signal<'playing' | 'won' | 'lost'>('playing');
  answer = signal<string | null>(null);
  message = signal<string>('');
  shakeRow = signal<number>(-1);
  animateRow = signal<number>(-1);
  shared = signal<boolean>(false);
  private submitting = false;

  /** Best status seen per letter, for keyboard colouring. */
  private keyStatuses = computed<Record<string, TileStatus>>(() => {
    const map: Record<string, TileStatus> = {};
    const rank: Record<TileStatus, number> = { ABSENT: 0, PRESENT: 1, CORRECT: 2 };
    for (const g of this.guesses()) {
      g.letters.forEach((letter, i) => {
        const s = g.statuses[i];
        const existing = map[letter];
        if (!existing || rank[s] > rank[existing]) map[letter] = s;
      });
    }
    return map;
  });

  board = computed(() => {
    const rows: { letter: string; status: TileStatus | null }[][] = [];
    const submitted = this.guesses();
    const current = this.currentGuess();
    const isPlaying = this.status() === 'playing';
    for (let r = 0; r < this.maxGuesses; r++) {
      const row: { letter: string; status: TileStatus | null }[] = [];
      const g = submitted[r];
      for (let c = 0; c < this.length; c++) {
        if (g) {
          row.push({ letter: g.letters[c], status: g.statuses[c] });
        } else if (r === submitted.length && isPlaying) {
          row.push({ letter: current[c] ?? '', status: null });
        } else {
          row.push({ letter: '', status: null });
        }
      }
      rows.push(row);
    }
    return rows;
  });

  ngOnInit(): void {
    this.restore();
  }

  tileClass(status: TileStatus | null, letter: string): string {
    switch (status) {
      case 'CORRECT': return 'bg-green-500 border-green-500 text-white';
      case 'PRESENT': return 'bg-yellow-500 border-yellow-500 text-white';
      case 'ABSENT': return 'bg-secondary-400 dark:bg-secondary-700 border-secondary-400 dark:border-secondary-700 text-white';
      default:
        return letter
          ? 'border-secondary-400 dark:border-secondary-500 text-secondary-900 dark:text-white'
          : 'border-secondary-300 dark:border-secondary-600 text-secondary-900 dark:text-white';
    }
  }

  keyClass(letter: string): string {
    switch (this.keyStatuses()[letter]) {
      case 'CORRECT': return '!bg-green-500 !text-white';
      case 'PRESENT': return '!bg-yellow-500 !text-white';
      case 'ABSENT': return '!bg-secondary-500 !text-white dark:!bg-secondary-800';
      default: return '';
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.isBrowser || this.status() !== 'playing') return;
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key;
    if (key === 'Enter') { this.onKey('enter'); }
    else if (key === 'Backspace') { this.onKey('backspace'); }
    else if (/^[a-zA-Z]$/.test(key)) { this.onKey(key.toLowerCase()); }
  }

  onKey(key: string): void {
    if (this.status() !== 'playing') return;
    if (key === 'enter') { this.submit(); return; }
    if (key === 'backspace') {
      this.currentGuess.update(g => g.slice(0, -1));
      return;
    }
    if (/^[a-z]$/.test(key) && this.currentGuess().length < this.length) {
      this.currentGuess.update(g => g + key);
    }
  }

  private submit(): void {
    if (this.submitting) return;
    const guess = this.currentGuess();
    if (guess.length !== this.length) {
      this.flashMessage('Not enough letters');
      this.triggerShake();
      return;
    }

    this.submitting = true;
    this.rherdle.guess({ mode: this.mode, slug: this.slug, guess }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (!res.accepted || !res.statuses) {
          this.flashMessage(res.reason || 'Not in word list');
          this.triggerShake();
          return;
        }
        const rowIndex = this.guesses().length;
        this.guesses.update(g => [...g, { letters: guess.split(''), statuses: res.statuses! }]);
        this.currentGuess.set('');
        this.animateRow.set(rowIndex);

        if (res.won) {
          this.answer.set(res.answer ?? guess);
          this.status.set('won');
          this.flashMessage('Magnificent!');
        } else if (this.guesses().length >= this.maxGuesses) {
          this.status.set('lost');
        }
        this.persist();
      },
      error: () => {
        this.submitting = false;
        this.flashMessage('Something went wrong. Try again.');
      }
    });
  }

  private triggerShake(): void {
    const r = this.guesses().length;
    this.shakeRow.set(r);
    if (this.isBrowser) setTimeout(() => this.shakeRow.set(-1), 450);
  }

  private flashMessage(text: string): void {
    this.message.set(text);
    if (this.isBrowser) setTimeout(() => this.message.set(''), 1800);
  }

  // --- Persistence ---
  private get storeKey(): string {
    return `rherdle:${this.mode}:${this.storageKey || this.slug || 'daily'}`;
  }

  private persist(): void {
    if (!this.isBrowser) return;
    const state: SavedState = {
      guesses: this.guesses(),
      status: this.status(),
      answer: this.answer()
    };
    try { localStorage.setItem(this.storeKey, JSON.stringify(state)); } catch { /* ignore */ }
  }

  private restore(): void {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem(this.storeKey);
      if (!raw) return;
      const state = JSON.parse(raw) as SavedState;
      if (!Array.isArray(state.guesses)) return;
      this.guesses.set(state.guesses);
      this.status.set(state.status ?? 'playing');
      this.answer.set(state.answer ?? null);
    } catch { /* ignore */ }
  }

  // --- Share ---
  share(): void {
    const emoji: Record<TileStatus, string> = { CORRECT: '🟩', PRESENT: '🟨', ABSENT: '⬛' };
    const label = this.mode === 'DAILY' ? `Rherdle ${this.storageKey}` : 'Rherdle';
    const score = this.status() === 'won' ? `${this.guesses().length}/${this.maxGuesses}` : `X/${this.maxGuesses}`;
    const grid = this.guesses()
      .map(g => g.statuses.map(s => emoji[s]).join(''))
      .join('\n');
    const text = `${label} ${score}\n\n${grid}`;

    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.shared.set(true);
        setTimeout(() => this.shared.set(false), 2000);
      }).catch(() => { /* ignore */ });
    }
  }
}
