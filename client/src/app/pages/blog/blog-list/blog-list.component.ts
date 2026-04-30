import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService, BlogPost } from '../../../services/blog.service';
import { TiltDirective } from '../../../directives/tilt.directive';
import { RevealDirective } from '../../../directives/reveal.directive';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TiltDirective, RevealDirective],
  template: `
    <div class="bg-white dark:bg-secondary-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-secondary-900 dark:text-white text-3d" appReveal="up">Blog</h1>
        <p class="text-lg text-secondary-600 dark:text-secondary-400 mb-12" appReveal="up" [revealDelay]="0.1">
          Thoughts on web development, software engineering, and technology.
        </p>

        <div class="mb-8 flex flex-wrap gap-2" appReveal="up" [revealStagger]="0.05">
          <button
            (click)="selectTag(null)"
            [class]="selectedTag() === null ? 'btn btn-primary' : 'btn btn-outline'"
          >
            All
          </button>
          <button
            *ngFor="let tag of uniqueTags()"
            (click)="selectTag(tag)"
            [class]="selectedTag() === tag ? 'btn btn-primary' : 'btn btn-outline'"
          >
            {{ tag }}
          </button>
        </div>

        <div class="grid gap-8">
          <div *ngFor="let post of filteredPosts()" class="card-3d has-shine post-card" appTilt [tiltDepth]="0.6" [tiltGlow]="true">
            <img
              *ngIf="post.coverImageUrl"
              [src]="post.coverImageUrl"
              [alt]="post.title"
              class="w-full h-48 object-cover rounded-lg mb-4"
            />
            <div class="flex justify-between items-start mb-3">
              <h2 class="text-2xl font-bold flex-1" data-depth="20">{{ post.title }}</h2>
              <span class="text-sm text-secondary-500 dark:text-secondary-400 whitespace-nowrap ml-2">
                {{ formatDate(post.date) }}
              </span>
            </div>
            <p class="text-secondary-600 dark:text-secondary-400 mb-4">{{ post.excerpt }}</p>
            <div class="flex gap-2 flex-wrap mb-4">
              <span *ngFor="let tag of post.tags" class="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded text-xs">
                {{ tag }}
              </span>
            </div>
            <a [routerLink]="['/blog', post.slug]" class="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300">
              Read More →
            </a>
            <div class="shine-overlay"></div>
          </div>
        </div>

        @if (loading()) {
          <div class="text-center py-12">
            <p class="text-secondary-600 dark:text-secondary-400">Loading...</p>
          </div>
        }

        <div *ngIf="!loading() && filteredPosts().length === 0" class="text-center py-12">
          <p class="text-lg text-secondary-600 dark:text-secondary-400">No posts found.</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BlogListComponent implements OnInit {
  posts = signal<BlogPost[]>([]);
  selectedTag = signal<string | null>(null);
  loading = signal(true);

  uniqueTags = computed(() => {
    const tags = new Set<string>();
    this.posts().forEach(post => post.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  });

  filteredPosts = computed(() => {
    const tag = this.selectedTag();
    const all = this.posts();
    return tag ? all.filter(post => post.tags.includes(tag)) : all;
  });

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.blogService.loadPublishedPosts().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  selectTag(tag: string | null): void {
    this.selectedTag.set(tag);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
