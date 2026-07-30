import { Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, afterNextRender, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService, BlogPost } from '../../services/blog.service';
import { TiltDirective } from '../../directives/tilt.directive';
import { RevealDirective } from '../../directives/reveal.directive';
import { GsapService } from '../../services/gsap.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TiltDirective, RevealDirective],
  template: `
    <div>
      <section
          #hero
          class="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800 py-20 md:py-32">
        <div #heroBg class="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40">
          <div class="hero-orb w-[28rem] h-[28rem] -top-32 -left-24 bg-gradient-to-br from-primary-300 to-primary-600 opacity-40 blur-3xl"></div>
          <div class="hero-orb w-[22rem] h-[22rem] top-40 -right-20 bg-gradient-to-br from-fuchsia-300 to-primary-500 opacity-30 blur-3xl"></div>
          <div class="hero-orb w-[18rem] h-[18rem] bottom-0 left-1/3 bg-gradient-to-br from-cyan-300 to-primary-400 opacity-30 blur-3xl"></div>
        </div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-2 gap-12 items-center perspective-1000">
            <div #heroText class="z-10">
              <h1 class="text-5xl md:text-6xl font-bold mb-6 text-secondary-900 dark:text-white text-3d">
                <span class="hero-line inline-block">Full Stack</span>&ngsp;<span class="hero-line inline-block text-gradient">Engineer</span>
              </h1>
              <p class="hero-line text-xl text-secondary-600 dark:text-secondary-400 mb-8">
                Building scalable applications with modern technologies. Passionate about clean code, user experience,
                and continuous learning.
              </p>
              <div class="hero-line flex gap-4">
                <a routerLink="/contact" class="btn btn-primary">Get In Touch</a>
                <a routerLink="/about" class="btn btn-outline">Learn More</a>
              </div>
            </div>

            <div #heroScene class="relative h-80 md:h-96 preserve-3d">
              <div class="parallax-layer w-72 h-72 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl rotate-12" data-depth="-30"></div>
              <div class="parallax-layer w-56 h-56 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/90 dark:bg-secondary-800/95 shadow-xl -rotate-6 backdrop-blur" data-depth="20"></div>
              <div class="parallax-layer w-40 h-40 left-[18%] top-[12%] rounded-full border-4 border-primary-400/60 dark:border-primary-300/40" data-depth="40"></div>
              <div class="parallax-layer w-16 h-16 right-[10%] bottom-[14%] rounded-2xl bg-gradient-to-br from-fuchsia-400 to-primary-500 shadow-lg rotate-45" data-depth="60"></div>
              <div class="parallax-layer w-6 h-6 right-[28%] top-[18%] rounded-full bg-cyan-300 shadow-md" data-depth="80"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-white dark:bg-secondary-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="section-title text-center" appReveal="up">Skills & Technologies</h2>
          <div class="grid md:grid-cols-3 gap-8" appReveal="up" [revealStagger]="0.12">
            <div class="card-3d text-center" appTilt [tiltDepth]="1" [tiltGlow]="true">
              <div class="text-4xl mb-4" data-depth="40">🎨</div>
              <h3 class="text-xl font-bold mb-2" data-depth="20">Frontend</h3>
              <p class="text-secondary-600 dark:text-secondary-400">Angular, React, Vue.js, TypeScript, Tailwind CSS,
                HTML5, CSS3</p>
            </div>
            <div class="card-3d text-center" appTilt [tiltDepth]="1" [tiltGlow]="true">
              <div class="text-4xl mb-4" data-depth="40">⚙️</div>
              <h3 class="text-xl font-bold mb-2" data-depth="20">Backend</h3>
              <p class="text-secondary-600 dark:text-secondary-400">Node.js, Python, Express, Django, PostgreSQL,
                MongoDB, REST APIs</p>
            </div>
            <div class="card-3d text-center" appTilt [tiltDepth]="1" [tiltGlow]="true">
              <div class="text-4xl mb-4" data-depth="40">🚀</div>
              <h3 class="text-xl font-bold mb-2" data-depth="20">DevOps</h3>
              <p class="text-secondary-600 dark:text-secondary-400">Docker, Kubernetes, CI/CD, AWS, GitHub Actions,
                Git</p>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-secondary-50 dark:bg-secondary-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="section-title text-center" appReveal="up">Featured Projects</h2>
          <div class="grid md:grid-cols-2 gap-8" appReveal="up" [revealStagger]="0.15">
            <div class="card-3d overflow-hidden has-shine" appTilt [tiltDepth]="0.8" [tiltGlow]="true">
              <div class="h-48 bg-gradient-to-br from-primary-400 to-primary-600 mb-4 rounded-md" data-depth="30"></div>
              <h3 class="text-2xl font-bold mb-2" data-depth="20">E-Commerce Platform</h3>
              <p class="text-secondary-600 dark:text-secondary-400 mb-4">
                Full-stack application built with Angular and Node.js featuring product catalog, shopping cart, and
                payment integration.
              </p>
              <div class="flex gap-2 flex-wrap mb-4">
                <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">Angular</span>
                <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">Node.js</span>
                <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">PostgreSQL</span>
              </div>
              <div class="shine-overlay"></div>
            </div>

            <div class="card-3d overflow-hidden has-shine" appTilt [tiltDepth]="0.8" [tiltGlow]="true">
              <div class="h-48 bg-gradient-to-br from-secondary-400 to-secondary-600 mb-4 rounded-md" data-depth="30"></div>
              <h3 class="text-2xl font-bold mb-2" data-depth="20">Social Media Dashboard</h3>
              <p class="text-secondary-600 dark:text-secondary-400 mb-4">
                Real-time analytics dashboard for managing multiple social media accounts with interactive charts and
                reports.
              </p>
              <div class="flex gap-2 flex-wrap mb-4">
                <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">React</span>
                <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">Python</span>
                <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">MongoDB</span>
              </div>
              <div class="shine-overlay"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-white dark:bg-secondary-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="section-title text-center" appReveal="up">Latest Blog Posts</h2>
          <div class="grid md:grid-cols-2 gap-8" appReveal="up" [revealStagger]="0.12">
            @for (post of recentPosts; track $index) {
              <div class="card-3d hover:shadow-lg transition-shadow has-shine" appTilt [tiltGlow]="true">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-xl font-bold flex-1">{{ post.title }}</h3>
                  <span class="text-sm text-secondary-500 dark:text-secondary-400 whitespace-nowrap ml-2">
                  {{ formatDate(post.date) }}
                </span>
                </div>
                <p class="text-secondary-600 dark:text-secondary-400 mb-4">{{ post.excerpt }}</p>
                <div class="flex gap-2 flex-wrap mb-4">
                <span *ngFor="let tag of post.tags"
                      class="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded text-xs">
                  {{ tag }}
                </span>
                </div>
                <a [routerLink]="['/blog', post.slug]"
                   class="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300">
                  Read More →
                </a>
                <div class="shine-overlay"></div>
              </div>
            }
          </div>
          <div class="text-center mt-12">
            <a routerLink="/blog" class="btn btn-primary">View All Posts</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('hero', { static: true }) heroEl!: ElementRef<HTMLElement>;
  @ViewChild('heroBg', { static: true }) heroBgEl!: ElementRef<HTMLElement>;
  @ViewChild('heroText', { static: true }) heroTextEl!: ElementRef<HTMLElement>;
  @ViewChild('heroScene', { static: true }) heroSceneEl!: ElementRef<HTMLElement>;

  recentPosts: BlogPost[] = [];
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly gsapService = inject(GsapService);
  private cleanups: Array<() => void> = [];

  constructor(private blogService: BlogService) {
    if (this.isBrowser) {
      afterNextRender(() => this.initAnimations());
    }
  }

  ngOnInit(): void {
    this.blogService.loadPublishedPosts().subscribe({
      next: (posts) => this.recentPosts = posts.slice(0, 2)
    });
  }

  ngOnDestroy(): void {
    for (const fn of this.cleanups) fn();
  }

  private async initAnimations() {
    const { gsap, ScrollTrigger, reduced } = await this.gsapService.loadGsap();
    if (reduced) return;

    const heroEl = this.heroEl?.nativeElement;
    const sceneEl = this.heroSceneEl?.nativeElement;
    const textEl = this.heroTextEl?.nativeElement;
    const bgEl = this.heroBgEl?.nativeElement;
    if (!heroEl || !sceneEl || !textEl) return;

    const lines = textEl.querySelectorAll<HTMLElement>('.hero-line');
    const layers = sceneEl.querySelectorAll<HTMLElement>('.parallax-layer');
    const orbs = bgEl?.querySelectorAll<HTMLElement>('.hero-orb') ?? [];

    // Intro timeline
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(lines, { opacity: 0, y: 28, duration: 0.7, stagger: 0.08 })
      .from(layers, { opacity: 0, scale: 0.85, y: 30, duration: 0.9, stagger: 0.07 }, '-=0.5');

    // Floating loops on scene layers.
    // Uses yPercent, not y: the pointer parallax below owns x/y, and two tweens
    // writing the same property would fight (GSAP does not overwrite by default).
    // Amplitude is converted from px so the motion looks identical either way.
    layers.forEach((layer, i) => {
      const amplitude = 10 + (i % 3) * 6;
      const height = layer.offsetHeight || amplitude;
      gsap.to(layer, {
        yPercent: '+=' + (amplitude / height) * 100,
        rotation: '+=' + (i % 2 === 0 ? 4 : -4),
        duration: 6 + i * 1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    });

    // Drifting orbs
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        x: (i % 2 === 0 ? 40 : -40),
        y: (i % 2 === 0 ? -30 : 30),
        duration: 10 + i * 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    });

    // Pointer parallax (depth-proportional)
    const setters = Array.from(layers).map((layer) => {
      const depth = Number(layer.dataset['depth'] ?? 0) || 0;
      const factor = depth * 0.4;
      return {
        x: gsap.quickTo(layer, 'x', { duration: 0.6, ease: 'power3.out' }),
        y: gsap.quickTo(layer, 'y', { duration: 0.6, ease: 'power3.out' }),
        factor
      };
    });
    const onMove = (e: MouseEvent) => {
      const rect = heroEl.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      for (const s of setters) {
        s.x(cx * s.factor);
        s.y(cy * s.factor);
      }
    };
    // Ease the layers back to rest when the pointer leaves, otherwise they stay
    // frozen at whatever offset they held on the way out.
    const onLeave = () => {
      for (const s of setters) {
        s.x(0);
        s.y(0);
      }
    };
    heroEl.addEventListener('mousemove', onMove);
    heroEl.addEventListener('mouseleave', onLeave);
    this.cleanups.push(() => {
      heroEl.removeEventListener('mousemove', onMove);
      heroEl.removeEventListener('mouseleave', onLeave);
    });

    // Scroll parallax on background orbs
    const bgTrigger = ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self: any) => {
        const p = self.progress;
        orbs.forEach((orb, i) => {
          gsap.set(orb, { yPercent: p * (20 + i * 10) });
        });
        gsap.set(sceneEl, { y: p * -40 });
      }
    });
    this.cleanups.push(() => bgTrigger.kill());
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
