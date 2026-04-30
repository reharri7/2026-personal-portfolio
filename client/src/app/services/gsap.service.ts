import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface GsapBundle {
  gsap: any;
  ScrollTrigger: any;
  reduced: boolean;
}

@Injectable({ providedIn: 'root' })
export class GsapService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private cached: Promise<GsapBundle> | null = null;

  loadGsap(): Promise<GsapBundle> {
    if (!this.isBrowser) {
      return Promise.resolve(this.stub(true));
    }
    if (this.cached) return this.cached;
    this.cached = (async () => {
      const reduced = this.prefersReducedMotion();
      const gsapMod = await import('gsap');
      const stMod = await import('gsap/ScrollTrigger');
      const gsap = gsapMod.gsap ?? gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger, reduced };
    })();
    return this.cached;
  }

  prefersReducedMotion(): boolean {
    if (!this.isBrowser) return true;
    return !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private stub(reduced: boolean): GsapBundle {
    const noop = () => ({ kill() {}, revert() {}, progress() { return 0; } });
    const gsap: any = {
      to: noop, from: noop, fromTo: noop, set: () => {},
      timeline: () => ({ to: noop, from: noop, fromTo: noop, set: () => ({}), kill() {}, add() { return this; } }),
      quickTo: () => () => {},
      registerPlugin: () => {},
      utils: { toArray: (x: any) => Array.isArray(x) ? x : [x] }
    };
    const ScrollTrigger: any = {
      create: () => ({ kill() {} }),
      refresh: () => {},
      getAll: () => [],
      killAll: () => {}
    };
    return { gsap, ScrollTrigger, reduced };
  }
}
