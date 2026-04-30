import { Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, afterNextRender, effect, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BlogService, BlogPost } from '../../../services/blog.service';
import { GsapService } from '../../../services/gsap.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-secondary-900">
      <div #container class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <a routerLink="/blog" class="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 mb-6 inline-block back-link">
          ← Back to Blog
        </a>

        @if (post()) {
          <article #article>
            <header class="mb-8">
              <h1 class="article-title text-5xl font-bold mb-4 text-secondary-900 dark:text-white text-3d">{{ post()!.title }}</h1>
              <div class="article-meta flex items-center justify-between mb-4 flex-wrap gap-4">
                <div class="text-secondary-600 dark:text-secondary-400">
                  <span>Published on {{ formatDate(post()!.date) }}</span>
                </div>
              </div>
              <div class="flex gap-2 flex-wrap">
                @for (tag of post()!.tags; track $index) {
                  <span class="article-tag px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">
                    {{ tag }}
                  </span>
                }
              </div>
            </header>

            <div class="article-body prose dark:prose-invert max-w-none prose-lg prose-headings:text-secondary-900 dark:prose-headings:text-white prose-a:text-primary-600 dark:prose-a:text-primary-400">
              <div [innerHTML]="sanitizedContent()"></div>
            </div>

            <footer class="mt-12 pt-8 border-t border-secondary-200 dark:border-secondary-700 article-footer">
              <div class="flex gap-4">
                <a routerLink="/contact" class="btn btn-primary">Get In Touch</a>
                <a routerLink="/blog" class="btn btn-secondary">View More Posts</a>
              </div>
            </footer>
          </article>
        }

        @if (loading()) {
          <div class="text-center py-12">
            <p class="text-secondary-600 dark:text-secondary-400">Loading...</p>
          </div>
        }

        @if (!loading() && !post()) {
          <div class="text-center py-12">
            <p class="text-lg text-secondary-600 dark:text-secondary-400">Post not found.</p>
            <a routerLink="/blog" class="btn btn-primary mt-4">Back to Blog</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) containerEl!: ElementRef<HTMLElement>;

  post = signal<BlogPost | undefined>(undefined);
  loading = signal(true);
  private animated = false;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly gsapService = inject(GsapService);
  private cleanups: Array<() => void> = [];

  sanitizedContent = computed(() => {
    const html = this.post()?.content ?? '';
    return html.replace(/style="([^"]*)"/gi, (_, decls: string) => {
      const cleaned = decls
        .split(';')
        .map(d => d.trim())
        .filter(d => d && !/^(color|background|background-color)\s*:/i.test(d))
        .join('; ');
      return cleaned ? `style="${cleaned}"` : '';
    });
  });

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {
    if (this.isBrowser) {
      effect(() => {
        if (this.post() && !this.animated) {
          this.animated = true;
          // Defer until the @if branch has rendered
          queueMicrotask(() => this.animateArticle());
        }
      });
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.blogService.getPostBySlug(slug).subscribe({
        next: (post) => {
          this.post.set(post);
          this.loading.set(false);
        },
        error: () => {
          this.post.set(undefined);
          this.loading.set(false);
        }
      });
    });
  }

  ngOnDestroy(): void {
    for (const fn of this.cleanups) fn();
  }

  private async animateArticle() {
    const container = this.containerEl?.nativeElement;
    if (!container) return;
    const { gsap, reduced } = await this.gsapService.loadGsap();
    if (reduced) return;

    const back = container.querySelector<HTMLElement>('.back-link');
    const title = container.querySelector<HTMLElement>('.article-title');
    const meta = container.querySelector<HTMLElement>('.article-meta');
    const tags = container.querySelectorAll<HTMLElement>('.article-tag');
    const body = container.querySelector<HTMLElement>('.article-body');
    const footer = container.querySelector<HTMLElement>('.article-footer');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (back) tl.from(back, { opacity: 0, x: -20, duration: 0.5 });
    if (title) tl.from(title, { opacity: 0, y: 30, duration: 0.7 }, '-=0.2');
    if (meta) tl.from(meta, { opacity: 0, y: 20, duration: 0.5 }, '-=0.4');
    if (tags.length) tl.from(tags, { opacity: 0, y: 10, scale: 0.9, duration: 0.4, stagger: 0.05 }, '-=0.3');
    if (body) tl.from(body, { opacity: 0, y: 20, duration: 0.7 }, '-=0.3');
    if (footer) tl.from(footer, { opacity: 0, y: 20, duration: 0.5 }, '-=0.4');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
