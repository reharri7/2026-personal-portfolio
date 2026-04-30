import { Directive, ElementRef, Input, OnDestroy, PLATFORM_ID, afterNextRender, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GsapService } from '../services/gsap.service';

export type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly gsapService = inject(GsapService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private trigger: any = null;

  @Input('appReveal') from: RevealFrom | '' = 'up';
  @Input() revealDelay = 0;
  @Input() revealDuration = 0.8;
  @Input() revealStagger = 0;
  @Input() revealStart = 'top 85%';

  constructor() {
    if (!this.isBrowser) return;
    afterNextRender(() => this.init());
  }

  private async init() {
    const host = this.el.nativeElement;
    const { gsap, ScrollTrigger, reduced } = await this.gsapService.loadGsap();
    if (reduced) return;

    const targets = this.revealStagger > 0
      ? Array.from(host.children) as HTMLElement[]
      : [host];
    if (!targets.length) return;

    const fromVars = this.fromVars(this.from || 'up');
    gsap.set(targets, fromVars);

    this.trigger = ScrollTrigger.create({
      trigger: host,
      start: this.revealStart,
      once: true,
      onEnter: () => {
        gsap.to(targets, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: this.revealDuration,
          delay: this.revealDelay,
          stagger: this.revealStagger,
          ease: 'power3.out'
        });
      }
    });
  }

  private fromVars(from: RevealFrom): Record<string, number> {
    switch (from) {
      case 'up':    return { opacity: 0, y: 40 };
      case 'down':  return { opacity: 0, y: -40 };
      case 'left':  return { opacity: 0, x: -40 };
      case 'right': return { opacity: 0, x: 40 };
      case 'scale': return { opacity: 0, scale: 0.92 };
      case 'fade':  return { opacity: 0 };
    }
  }

  ngOnDestroy(): void {
    if (this.trigger) this.trigger.kill();
  }
}
