import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BlogService, BlogPost } from '../../../services/blog.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-secondary-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <a routerLink="/blog" class="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 mb-6 inline-block">
          ← Back to Blog
        </a>

        <article>
          <header class="mb-8">
            <h1 class="text-5xl font-bold mb-4 text-secondary-900 dark:text-white">{{ post?.title }}</h1>
            <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div class="text-secondary-600 dark:text-secondary-400">
                <span>Published on {{ formatDate(post?.date || '') }}</span>
              </div>
            </div>
            <div class="flex gap-2 flex-wrap">
              @for (tag of post?.tags; track $index) {
                <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">
                  {{ tag }}
                </span>
              }
            </div>
          </header>

          <div class="prose dark:prose-invert max-w-none">
            <div class="text-lg text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
              {{ post?.content }}
            </div>
          </div>

          <footer class="mt-12 pt-8 border-t border-secondary-200 dark:border-secondary-700">
            <div class="flex gap-4">
              <a routerLink="/contact" class="btn btn-primary">Get In Touch</a>
              <a routerLink="/blog" class="btn btn-secondary">View More Posts</a>
            </div>
          </footer>
        </article>
      </div>
    </div>
  `,
  styles: []
})
export class BlogDetailComponent implements OnInit {
  post: BlogPost | undefined;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.post = this.blogService.getPostBySlug(slug);
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
