import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RherdleService, RherdleWord } from '../../services/rherdle.service';

interface DayCell {
  date: string;        // yyyy-MM-dd, or '' for padding cells
  day: number;
  isToday: boolean;
  word?: string;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

@Component({
  selector: 'app-admin-rherdle-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Calendar -->
      <div class="lg:col-span-2">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-secondary-900 dark:text-white">Schedule</h2>
            <div class="flex items-center gap-2">
              <button (click)="prevMonth()" class="btn btn-sm btn-secondary" aria-label="Previous month">‹</button>
              <span class="font-semibold text-secondary-900 dark:text-white w-40 text-center">{{ monthLabel() }}</span>
              <button (click)="nextMonth()" class="btn btn-sm btn-secondary" aria-label="Next month">›</button>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1 mb-1">
            @for (d of weekdays; track $index) {
              <div class="text-center text-xs font-semibold text-secondary-500 dark:text-secondary-400 py-1">{{ d }}</div>
            }
          </div>
          <div class="grid grid-cols-7 gap-1">
            @for (cell of calendar(); track $index) {
              @if (cell.date) {
                <button
                  type="button"
                  (click)="selectDate(cell.date)"
                  class="aspect-square rounded-lg border p-1 flex flex-col items-center justify-start text-left transition-colors"
                  [class.border-primary-500]="selectedDate() === cell.date"
                  [class.ring-2]="selectedDate() === cell.date"
                  [class.ring-primary-500]="selectedDate() === cell.date"
                  [ngClass]="cell.word
                    ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700'
                    : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700'">
                  <span class="text-xs font-semibold"
                        [class.text-primary-600]="cell.isToday"
                        [class.dark:text-primary-400]="cell.isToday"
                        [class.text-secondary-700]="!cell.isToday"
                        [class.dark:text-secondary-300]="!cell.isToday">{{ cell.day }}</span>
                  @if (cell.word) {
                    <span class="mt-auto w-full truncate text-[10px] sm:text-xs font-mono uppercase text-primary-700 dark:text-primary-300">{{ cell.word }}</span>
                  }
                </button>
              } @else {
                <div class="aspect-square"></div>
              }
            }
          </div>
        </div>

        <!-- Assign panel -->
        @if (selectedDate()) {
          <div class="card mt-4">
            <h3 class="text-lg font-bold mb-3 text-secondary-900 dark:text-white">{{ selectedDate() }}</h3>
            @if (wordForSelectedDate(); as scheduled) {
              <p class="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                Scheduled word: <span class="font-mono font-bold uppercase text-primary-700 dark:text-primary-300">{{ scheduled }}</span>
              </p>
              <button (click)="clearDate()" class="btn btn-sm btn-error">Clear this day</button>
            } @else {
              <p class="text-sm text-secondary-600 dark:text-secondary-400 mb-3">No word scheduled. Pick one to assign:</p>
              <div class="flex gap-2 items-center flex-wrap">
                <select [(ngModel)]="assignWordId"
                        class="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white">
                  <option [ngValue]="null" disabled>Choose a word…</option>
                  @for (w of unscheduledWords(); track w.id) {
                    <option [ngValue]="w.id">{{ w.word }}</option>
                  }
                </select>
                <button (click)="assign()" class="btn btn-sm btn-primary" [disabled]="assignWordId === null">Assign</button>
              </div>
              @if (unscheduledWords().length === 0) {
                <p class="text-xs text-secondary-500 dark:text-secondary-400 mt-2">No unscheduled words left — add more in the pool.</p>
              }
            }
          </div>
        }
      </div>

      <!-- Word pool -->
      <div class="lg:col-span-1">
        <div class="card">
          <h2 class="text-2xl font-bold mb-3 text-secondary-900 dark:text-white">Word pool</h2>
          <p class="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
            Unscheduled words are auto-assigned to any day without a chosen word. One per line.
          </p>
          <textarea
            [(ngModel)]="wordsInput"
            rows="4"
            class="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white font-mono lowercase focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="crane&#10;slate&#10;pride"
          ></textarea>
          <button (click)="addWords()" class="btn btn-primary btn-sm mt-3 mb-4" [disabled]="saving()">Add words</button>

          <div class="space-y-2 max-h-96 overflow-y-auto">
            @for (w of words(); track w.id) {
              <div class="flex items-center justify-between gap-2 p-2 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                <span class="font-mono font-semibold uppercase text-secondary-900 dark:text-white">{{ w.word }}</span>
                <div class="flex items-center gap-2">
                  @if (w.scheduledDate) {
                    <span class="text-xs text-primary-600 dark:text-primary-400">{{ w.scheduledDate }}</span>
                  }
                  <button (click)="deleteWord(w.id)" class="text-xs text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            } @empty {
              <p class="text-center text-secondary-500 dark:text-secondary-400 py-6">No words yet.</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminRherdleTabComponent implements OnInit {
  private readonly rherdle = inject(RherdleService);

  words = signal<RherdleWord[]>([]);
  wordsInput = '';
  saving = signal(false);
  selectedDate = signal<string | null>(null);
  assignWordId: number | null = null;

  // First day of the displayed month.
  private viewMonth = signal<{ year: number; month: number }>(this.initialMonth());

  private initialMonth(): { year: number; month: number } {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private scheduledMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const w of this.words()) {
      if (w.scheduledDate) map[w.scheduledDate] = w.word;
    }
    return map;
  });

  unscheduledWords = computed(() => this.words().filter(w => !w.scheduledDate));

  monthLabel = computed(() => `${MONTH_NAMES[this.viewMonth().month]} ${this.viewMonth().year}`);

  wordForSelectedDate = computed(() => {
    const d = this.selectedDate();
    return d ? this.scheduledMap()[d] : undefined;
  });

  calendar = computed<DayCell[]>(() => {
    const { year, month } = this.viewMonth();
    const map = this.scheduledMap();
    const todayStr = this.toDateStr(new Date());
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ date: '', day: 0, isToday: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${this.pad(month + 1)}-${this.pad(day)}`;
      cells.push({ date, day, isToday: date === todayStr, word: map[date] });
    }
    return cells;
  });

  ngOnInit(): void {
    this.loadWords();
  }

  private pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
  private toDateStr(d: Date): string { return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`; }

  prevMonth(): void {
    this.viewMonth.update(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  }
  nextMonth(): void {
    this.viewMonth.update(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.assignWordId = null;
  }

  private loadWords(): void {
    this.rherdle.listWords().subscribe({ next: (w) => this.words.set(w) });
  }

  addWords(): void {
    if (!this.wordsInput.trim()) return;
    this.saving.set(true);
    this.rherdle.addWords(this.wordsInput).subscribe({
      next: () => { this.saving.set(false); this.wordsInput = ''; this.loadWords(); },
      error: () => this.saving.set(false)
    });
  }

  assign(): void {
    const date = this.selectedDate();
    if (this.assignWordId === null || !date) return;
    this.rherdle.scheduleWord(this.assignWordId, date).subscribe({
      next: () => { this.assignWordId = null; this.loadWords(); }
    });
  }

  clearDate(): void {
    const date = this.selectedDate();
    if (!date) return;
    const word = this.words().find(w => w.scheduledDate === date);
    if (!word) return;
    this.rherdle.scheduleWord(word.id, null).subscribe({ next: () => this.loadWords() });
  }

  deleteWord(id: number): void {
    if (!confirm('Delete this word from the pool?')) return;
    this.rherdle.deleteWord(id).subscribe({ next: () => this.loadWords() });
  }
}
