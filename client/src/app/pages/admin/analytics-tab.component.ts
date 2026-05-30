import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CountItem {
  label: string;
  count: number;
}

interface DailyCount {
  date: string;
  pageViews: number;
  visitors: number;
}

interface AnalyticsSummary {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  avgSessionDurationMs: number;
  bounceRate: number;
  topReferrers: CountItem[];
  topPages: CountItem[];
  utmSources: CountItem[];
  utmMediums: CountItem[];
  utmCampaigns: CountItem[];
  deviceTypes: CountItem[];
  daily: DailyCount[];
}

@Component({
  selector: 'app-analytics-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card p-4">
      <h3 class="font-semibold mb-3 text-secondary-900 dark:text-white">{{ title }}</h3>
      @if (items.length === 0) {
        <p class="text-secondary-500 text-sm">{{ emptyLabel }}</p>
      } @else {
        <ul class="space-y-2">
          @for (item of items; track item.label) {
            <li class="flex items-center justify-between gap-3 text-sm">
              <span class="truncate text-secondary-700 dark:text-secondary-300">{{ item.label }}</span>
              <span class="font-semibold text-secondary-900 dark:text-white tabular-nums">{{ item.count }}</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: []
})
export class AnalyticsListComponent {
  @Input() title = '';
  @Input() emptyLabel = 'No data';
  @Input() items: CountItem[] = [];
}

@Component({
  selector: 'app-analytics-tab',
  standalone: true,
  imports: [CommonModule, AnalyticsListComponent],
  template: `
    <div class="space-y-8">
      <!-- Range selector -->
      <div class="flex items-center gap-2">
        @for (r of ranges; track r.days) {
          <button
            (click)="setRange(r.days)"
            [class]="rangeDays() === r.days
              ? 'px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm'
              : 'px-3 py-1.5 bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg text-sm hover:bg-secondary-300 dark:hover:bg-secondary-600'"
          >{{ r.label }}</button>
        }
      </div>

      @if (loading()) {
        <div class="card text-center py-12">
          <span class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      } @else if (error()) {
        <div class="card text-center py-12 text-red-600 dark:text-red-400">{{ error() }}</div>
      } @else if (summary(); as s) {
        <!-- KPI cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="card p-4">
            <p class="text-xs uppercase tracking-wide text-secondary-500">Unique Visitors</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-white">{{ s.uniqueVisitors }}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs uppercase tracking-wide text-secondary-500">Page Views</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-white">{{ s.pageViews }}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs uppercase tracking-wide text-secondary-500">Sessions</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-white">{{ s.sessions }}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs uppercase tracking-wide text-secondary-500">Avg. Session</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-white">{{ formatDuration(s.avgSessionDurationMs) }}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs uppercase tracking-wide text-secondary-500">Bounce Rate</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-white">{{ (s.bounceRate * 100) | number:'1.0-0' }}%</p>
          </div>
        </div>

        <!-- Daily page views bar chart -->
        <div class="card p-4">
          <h3 class="font-semibold mb-4 text-secondary-900 dark:text-white">Page Views Over Time</h3>
          @if (s.daily.length === 0) {
            <p class="text-secondary-500 text-sm">No data for this range.</p>
          } @else {
            <div class="flex items-end gap-1 h-40">
              @for (d of s.daily; track d.date) {
                <div class="flex-1 flex flex-col items-center justify-end group"
                     [title]="d.date + ': ' + d.pageViews + ' views, ' + d.visitors + ' visitors'">
                  <div class="w-full bg-primary-500 rounded-t transition-all"
                       [style.height.%]="barHeight(d.pageViews)"></div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Breakdown tables -->
        <div class="grid md:grid-cols-2 gap-6">
          <app-analytics-list title="Top Referrers" emptyLabel="Direct / none" [items]="s.topReferrers"></app-analytics-list>
          <app-analytics-list title="Top Pages" [items]="s.topPages"></app-analytics-list>
          <app-analytics-list title="UTM Sources" [items]="s.utmSources"></app-analytics-list>
          <app-analytics-list title="UTM Mediums" [items]="s.utmMediums"></app-analytics-list>
          <app-analytics-list title="UTM Campaigns" [items]="s.utmCampaigns"></app-analytics-list>
          <app-analytics-list title="Devices" [items]="s.deviceTypes"></app-analytics-list>
        </div>
      }
    </div>
  `,
  styles: []
})
export class AnalyticsTabComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly summaryUrl = `${environment.apiUrl}/admin/analytics/summary`;

  readonly ranges = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 }
  ];

  rangeDays = signal(30);
  summary = signal<AnalyticsSummary | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private maxDaily = computed(() =>
    Math.max(1, ...(this.summary()?.daily.map((d) => d.pageViews) ?? [1]))
  );

  ngOnInit(): void {
    this.load();
  }

  setRange(days: number): void {
    this.rangeDays.set(days);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (this.rangeDays() - 1));
    const params = { from: this.isoDate(from), to: this.isoDate(to) };

    this.http.get<AnalyticsSummary>(this.summaryUrl, { params }).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load analytics.');
        this.loading.set(false);
      }
    });
  }

  barHeight(views: number): number {
    return Math.round((views / this.maxDaily()) * 100);
  }

  formatDuration(ms: number): string {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  private isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
