import { Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, afterNextRender, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TiltDirective } from '../../directives/tilt.directive';
import { RevealDirective } from '../../directives/reveal.directive';
import { GsapService } from '../../services/gsap.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TiltDirective, RevealDirective],
  template: `
    <div class="bg-white dark:bg-secondary-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div #intro class="grid md:grid-cols-3 gap-12 items-start mb-20">
          <div class="md:col-span-1">
            <div #portrait class="relative h-64 mx-4 mt-6 mb-20 perspective-1000">
              <div class="parallax-layer w-full h-full left-0 top-0 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl" data-depth="-20"></div>
              <div class="parallax-layer w-32 h-32 -top-6 -left-4 rounded-2xl bg-white/90 dark:bg-secondary-800/95 shadow-xl rotate-6 backdrop-blur" data-depth="30"></div>
              <div class="parallax-layer w-20 h-20 bottom-4 -right-4 rounded-full border-4 border-primary-300/70 dark:border-primary-300/40" data-depth="50"></div>
              <div class="parallax-layer w-10 h-10 top-8 right-6 rounded-xl bg-gradient-to-br from-fuchsia-400 to-primary-500 shadow-lg rotate-12" data-depth="70"></div>
            </div>
            <a href="#" class="btn btn-primary w-full text-center">Download Resume</a>
          </div>
          <div #introText class="md:col-span-2">
            <h1 class="intro-line text-4xl font-bold mb-4 text-secondary-900 dark:text-white text-3d">About Me</h1>
            <p class="intro-line text-lg text-secondary-600 dark:text-secondary-400 mb-6">
              I'm a passionate full stack engineer with 5+ years of experience building scalable web applications. I specialize in creating modern, responsive interfaces and robust backend systems that solve real-world problems.
            </p>
            <p class="intro-line text-lg text-secondary-600 dark:text-secondary-400 mb-6">
              My journey in tech started with a curiosity about how things work. Over the years, I've honed my skills across the full spectrum of web development, from crafting pixel-perfect UIs to designing efficient database architectures.
            </p>
            <p class="intro-line text-lg text-secondary-600 dark:text-secondary-400">
              When I'm not coding, you can find me contributing to open-source projects, writing technical blog posts, or mentoring junior developers. I believe in lifelong learning and staying updated with the latest technologies and best practices.
            </p>
          </div>
        </div>

        <section #skillsSection class="mb-20">
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white" appReveal="up">Skills</h2>
          <div class="grid md:grid-cols-2 gap-8">
            <div appReveal="left">
              <h3 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-500">Frontend</h3>
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Angular</span>
                    <span class="text-secondary-500 dark:text-secondary-400">95%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="95" style="width: 95%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">TypeScript</span>
                    <span class="text-secondary-500 dark:text-secondary-400">90%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="90" style="width: 90%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">React</span>
                    <span class="text-secondary-500 dark:text-secondary-400">85%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="85" style="width: 85%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Tailwind CSS</span>
                    <span class="text-secondary-500 dark:text-secondary-400">88%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="88" style="width: 88%"></div>
                  </div>
                </div>
              </div>
            </div>

            <div appReveal="right">
              <h3 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-500">Backend</h3>
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Node.js</span>
                    <span class="text-secondary-500 dark:text-secondary-400">92%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="92" style="width: 92%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Python</span>
                    <span class="text-secondary-500 dark:text-secondary-400">80%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="80" style="width: 80%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">PostgreSQL</span>
                    <span class="text-secondary-500 dark:text-secondary-400">85%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="85" style="width: 85%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-secondary-700 dark:text-secondary-300">Docker</span>
                    <span class="text-secondary-500 dark:text-secondary-400">78%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                    <div class="skill-bar bg-primary-600 dark:bg-primary-500 h-2 rounded-full" data-target="78" style="width: 78%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mb-20">
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white" appReveal="up">Experience</h2>
          <div class="space-y-8" appReveal="up" [revealStagger]="0.12">
            <div class="card-3d border-l-4 border-primary-600" appTilt [tiltDepth]="0.6" [tiltGlow]="true">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold" data-depth="20">Senior Full Stack Engineer</h3>
                <span class="text-sm text-secondary-500">2022 - Present</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold mb-2" data-depth="10">Tech Innovators Inc.</p>
              <p class="text-secondary-600 dark:text-secondary-400">
                Leading frontend and backend development for scalable SaaS applications. Mentoring junior developers and establishing best practices for code quality and architecture.
              </p>
            </div>

            <div class="card-3d border-l-4 border-primary-600" appTilt [tiltDepth]="0.6" [tiltGlow]="true">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold" data-depth="20">Full Stack Developer</h3>
                <span class="text-sm text-secondary-500">2020 - 2022</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold mb-2" data-depth="10">Digital Solutions Ltd.</p>
              <p class="text-secondary-600 dark:text-secondary-400">
                Developed and maintained multiple client projects using Angular, React, and Node.js. Implemented CI/CD pipelines and improved application performance by 40%.
              </p>
            </div>

            <div class="card-3d border-l-4 border-primary-600" appTilt [tiltDepth]="0.6" [tiltGlow]="true">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold" data-depth="20">Junior Web Developer</h3>
                <span class="text-sm text-secondary-500">2019 - 2020</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold mb-2" data-depth="10">StartUp Ventures</p>
              <p class="text-secondary-600 dark:text-secondary-400">
                Built responsive web applications using HTML, CSS, and JavaScript. Collaborated with designers and backend developers to deliver complete solutions.
              </p>
            </div>
          </div>
        </section>

        <section class="mb-20">
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white" appReveal="up">Education</h2>
          <div class="space-y-6" appReveal="up" [revealStagger]="0.1">
            <div class="card-3d" appTilt [tiltGlow]="true">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">Bachelor of Science in Computer Science</h3>
                <span class="text-sm text-secondary-500">2018</span>
              </div>
              <p class="text-primary-600 dark:text-primary-500 font-semibold">State University</p>
            </div>

            <div class="card-3d" appTilt [tiltGlow]="true">
              <h3 class="text-xl font-bold mb-1">AWS Certified Solutions Architect</h3>
              <p class="text-primary-600 dark:text-primary-500 font-semibold">Amazon Web Services - 2023</p>
            </div>

            <div class="card-3d" appTilt [tiltGlow]="true">
              <h3 class="text-xl font-bold mb-1">Google Cloud Professional Data Engineer</h3>
              <p class="text-primary-600 dark:text-primary-500 font-semibold">Google Cloud - 2023</p>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-3xl font-bold mb-8 text-secondary-900 dark:text-white" appReveal="up">Certifications</h2>
          <div class="grid md:grid-cols-2 gap-4" appReveal="up" [revealStagger]="0.08">
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">AWS Solutions Architect Professional</span>
            </div>
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">Kubernetes Application Developer</span>
            </div>
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">Google Cloud Professional</span>
            </div>
            <div class="flex items-center">
              <span class="text-2xl mr-3">✓</span>
              <span class="text-secondary-700 dark:text-secondary-300">MongoDB Associate Developer</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: []
})
export class AboutComponent implements OnDestroy {
  @ViewChild('intro', { static: true }) introEl!: ElementRef<HTMLElement>;
  @ViewChild('introText', { static: true }) introTextEl!: ElementRef<HTMLElement>;
  @ViewChild('portrait', { static: true }) portraitEl!: ElementRef<HTMLElement>;
  @ViewChild('skillsSection', { static: true }) skillsEl!: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly gsapService = inject(GsapService);
  private cleanups: Array<() => void> = [];

  constructor() {
    if (this.isBrowser) {
      afterNextRender(() => this.initAnimations());
    }
  }

  ngOnDestroy(): void {
    for (const fn of this.cleanups) fn();
  }

  private async initAnimations() {
    const { gsap, ScrollTrigger, reduced } = await this.gsapService.loadGsap();
    if (reduced) return;

    const introText = this.introTextEl?.nativeElement;
    const portrait = this.portraitEl?.nativeElement;
    const skillsEl = this.skillsEl?.nativeElement;

    // Intro text + portrait timeline
    if (introText && portrait) {
      const lines = introText.querySelectorAll<HTMLElement>('.intro-line');
      const layers = portrait.querySelectorAll<HTMLElement>('.parallax-layer');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(layers, { opacity: 0, scale: 0.85, y: 20, duration: 0.8, stagger: 0.08 })
        .from(lines, { opacity: 0, y: 24, duration: 0.6, stagger: 0.08 }, '-=0.5');

      // yPercent rather than y: the pointer parallax below owns x/y, and two
      // tweens on the same property fight (GSAP does not overwrite by default).
      // Amplitude is converted from px so the motion looks identical either way.
      layers.forEach((layer, i) => {
        const amplitude = 6 + (i % 3) * 4;
        const height = layer.offsetHeight || amplitude;
        gsap.to(layer, {
          yPercent: '+=' + (amplitude / height) * 100,
          rotation: '+=' + (i % 2 === 0 ? 3 : -3),
          duration: 5 + i,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
      });

      // Pointer parallax on portrait
      const setters = Array.from(layers).map((layer) => {
        const depth = Number(layer.dataset['depth'] ?? 0) || 0;
        return {
          x: gsap.quickTo(layer, 'x', { duration: 0.5, ease: 'power3.out' }),
          y: gsap.quickTo(layer, 'y', { duration: 0.5, ease: 'power3.out' }),
          factor: depth * 0.3
        };
      });
      const onMove = (e: MouseEvent) => {
        const rect = portrait.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        for (const s of setters) {
          s.x(cx * s.factor);
          s.y(cy * s.factor);
        }
      };
      // Ease back to rest when the pointer leaves, otherwise the layers stay
      // frozen at whatever offset they held on the way out.
      const onLeave = () => {
        for (const s of setters) {
          s.x(0);
          s.y(0);
        }
      };
      portrait.addEventListener('mousemove', onMove);
      portrait.addEventListener('mouseleave', onLeave);
      this.cleanups.push(() => {
        portrait.removeEventListener('mousemove', onMove);
        portrait.removeEventListener('mouseleave', onLeave);
      });
    }

    // Skill bars: collapse to 0 then animate to target on scroll into view.
    // Initial render keeps target width inline so SSR + reduced-motion show full bars.
    if (skillsEl) {
      const bars = skillsEl.querySelectorAll<HTMLElement>('.skill-bar');
      gsap.set(bars, { width: 0 });
      const trigger = ScrollTrigger.create({
        trigger: skillsEl,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          bars.forEach((bar, i) => {
            const target = Number(bar.dataset['target'] ?? 0) || 0;
            gsap.to(bar, {
              width: target + '%',
              duration: 1.2,
              delay: i * 0.05,
              ease: 'power3.out'
            });
          });
        }
      });
      this.cleanups.push(() => trigger.kill());
    }
  }
}
