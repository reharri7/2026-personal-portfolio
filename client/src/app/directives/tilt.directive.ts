import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appTilt]',
  standalone: true
})
export class TiltDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private rafId: number | null = null;
  private rect: DOMRect | null = null;
  private currentX = 0;
  private currentY = 0;
  private active = false;
  // Internal resolved max tilt value in degrees
  private _maxTilt = 12;

  // Accepts: number | string | null | undefined. Empty string or invalid -> defaults to 12.
  @Input('appTilt')
  set maxTiltInput(value: unknown) {
    // Handle bare attribute ("") and absence (null/undefined)
    if (value === '' || value === null || value === undefined) {
      this._maxTilt = 12;
      return;
    }
    // Coerce strings/numbers
    const num = Number(value as any);
    this._maxTilt = Number.isFinite(num) ? num : 12;
  }
  get maxTiltInput(): number { return this._maxTilt; }
  @Input() glare = true;

  private isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const host = this.el.nativeElement;
    host.style.transformStyle = 'preserve-3d';
    host.style.transition = 'transform 150ms ease-out';
    host.style.willChange = 'transform';
    this.rect = host.getBoundingClientRect();

    // Add shine overlay element if opted-in via has-shine class
    if (this.glare && !host.querySelector('.shine-overlay')) {
      const shine = document.createElement('div');
      shine.className = 'shine-overlay';
      shine.style.background = 'radial-gradient(600px 600px at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.35), rgba(255,255,255,0))';
      host.classList.add('has-shine');
      host.appendChild(shine);
    }
  }

  ngOnDestroy(): void {
    if (this.rafId != null && this.isBrowser) cancelAnimationFrame(this.rafId);
  }

  @HostListener('mouseenter') onEnter() {
    if (!this.isBrowser || this.prefersReducedMotion()) return;
    this.active = true;
    this.rect = this.el.nativeElement.getBoundingClientRect();
  }

  @HostListener('mouseleave') onLeave() {
    if (!this.isBrowser) return;
    this.active = false;
    this.animateTo(0, 0, true);
    this.setShine(50, 50);
  }

  @HostListener('mousemove', ['$event']) onMove(e: MouseEvent) {
    if (!this.isBrowser || !this.rect || this.prefersReducedMotion()) return;
    const x = (e.clientX - this.rect.left) / this.rect.width; // 0..1
    const y = (e.clientY - this.rect.top) / this.rect.height; // 0..1
    const tiltX = (this._maxTilt * (0.5 - y));
    const tiltY = (this._maxTilt * (x - 0.5));
    this.animateTo(tiltX, tiltY, false);
    this.setShine(x * 100, y * 100);
  }

  // Touch support (center-based slight tilt)
  @HostListener('touchstart') onTouchStart() {
    if (!this.isBrowser || this.prefersReducedMotion()) return;
    this.active = true;
    this.rect = this.el.nativeElement.getBoundingClientRect();
  }

  @HostListener('touchmove', ['$event']) onTouchMove(e: TouchEvent) {
    if (!this.isBrowser || !this.rect || this.prefersReducedMotion()) return;
    const t = e.touches[0];
    const x = (t.clientX - this.rect.left) / this.rect.width;
    const y = (t.clientY - this.rect.top) / this.rect.height;
    const tiltX = (this._maxTilt * 0.6 * (0.5 - y));
    const tiltY = (this._maxTilt * 0.6 * (x - 0.5));
    this.animateTo(tiltX, tiltY, false);
    this.setShine(x * 100, y * 100);
  }

  @HostListener('touchend') onTouchEnd() { this.onLeave(); }

  private animateTo(xDeg: number, yDeg: number, reset: boolean) {
    this.currentX = xDeg; this.currentY = yDeg;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      const host = this.el.nativeElement;
      host.style.transform = `rotateX(${this.currentX}deg) rotateY(${this.currentY}deg)` + (reset ? ' translateZ(0)' : '');
    });
  }

  private setShine(mx: number, my: number) {
    const host = this.el.nativeElement as HTMLElement;
    host.style.setProperty('--mx', `${mx}%`);
    host.style.setProperty('--my', `${my}%`);
  }

  private prefersReducedMotion(): boolean {
    if (!this.isBrowser) return true;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
