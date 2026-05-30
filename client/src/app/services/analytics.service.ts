import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface PendingView {
  path: string;
  enterTime: number;
  isEntry: boolean;
}

const SESSION_ID_KEY = 'rh_analytics_session';
const UTM_KEY = 'rh_analytics_utm';

/**
 * Privacy-first, first-party page-view tracking. No cookies: the session id lives
 * in sessionStorage (cleared on tab close) and the server derives an anonymous,
 * daily-rotating visitor hash. One event is sent per page view, carrying the dwell
 * time measured when the visitor leaves that page (on the next navigation or on
 * tab close via sendBeacon).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly collectUrl = `${environment.apiUrl}/public/analytics/collect`;
  private readonly browser: boolean;

  private referrer: string | null = null;
  private utm: UtmParams = {};
  private pending: PendingView | null = null;
  private firstView = true;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private readonly http: HttpClient
  ) {
    this.browser = isPlatformBrowser(platformId);
  }

  /** Call once from the app root before tracking begins. */
  init(): void {
    if (!this.browser) return;

    this.referrer = document.referrer || null;
    this.utm = this.readUtm();

    // Flush the current page's dwell when the tab is hidden/closed. sendBeacon
    // survives page unload and does not require the credentials interceptor.
    const flush = () => {
      if (document.visibilityState === 'hidden') {
        this.finalizePending(true);
      }
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', () => this.finalizePending(true));
  }

  /** Record a page view. Finalizes the previous page's dwell, then opens a new one. */
  trackPageView(path: string): void {
    if (!this.browser) return;

    // Finalize the page we are leaving (sent via normal POST while the tab is alive).
    this.finalizePending(false);

    this.pending = {
      path,
      enterTime: this.now(),
      isEntry: this.firstView
    };
    this.firstView = false;
  }

  private finalizePending(useBeacon: boolean): void {
    if (!this.pending) return;

    const view = this.pending;
    this.pending = null;

    const payload = {
      path: view.path,
      referrer: this.referrer ?? undefined,
      ...this.utm,
      sessionId: this.sessionId(),
      dwellMs: Math.max(0, Math.round(this.now() - view.enterTime)),
      isEntry: view.isEntry
    };

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(this.collectUrl, blob);
      return;
    }

    // Fire-and-forget; analytics failures must never disrupt the app.
    this.http.post(this.collectUrl, payload).subscribe({ error: () => {} });
  }

  private sessionId(): string {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${this.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  }

  /** UTM params persist for the whole session from the landing URL. */
  private readUtm(): UtmParams {
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) {
      return JSON.parse(stored) as UtmParams;
    }

    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {
      utmSource: params.get('utm_source') ?? undefined,
      utmMedium: params.get('utm_medium') ?? undefined,
      utmCampaign: params.get('utm_campaign') ?? undefined,
      utmTerm: params.get('utm_term') ?? undefined,
      utmContent: params.get('utm_content') ?? undefined
    };

    if (Object.values(utm).some((v) => v != null)) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
    return utm;
  }

  private now(): number {
    return performance?.now ? performance.now() : Date.now();
  }
}
