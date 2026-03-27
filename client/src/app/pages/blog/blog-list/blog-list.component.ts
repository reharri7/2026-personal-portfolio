import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService, BlogPost } from '../../../services/blog.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-secondary-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 class="text-4xl font-bold mb-4 text-secondary-900 dark:text-white">Blog</h1>
        <p class="text-lg text-secondary-600 dark:text-secondary-400 mb-12">
          Thoughts on web development, software engineering, and technology.
        </p>

        <div class="mb-8 flex flex-wrap gap-2">
          <button
            (click)="selectTag(null)"
            [class]="selectedTag() === null ? 'btn btn-primary' : 'btn btn-outline'"
          >
            All
          </button>
          <button
            *ngFor="let tag of uniqueTags"
            (click)="selectTag(tag)"
            [class]="selectedTag() === tag ? 'btn btn-primary' : 'btn btn-outline'"
          >
            {{ tag }}
          </button>
        </div>

        <div class="grid gap-8">
          <div *ngFor="let post of filteredPosts" class="card hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <h2 class="text-2xl font-bold flex-1">{{ post.title }}</h2>
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
          </div>
        </div>

        <div *ngIf="filteredPosts.length === 0" class="text-center py-12">
          <p class="text-lg text-secondary-600 dark:text-secondary-400">No posts found for this tag.</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BlogListComponent implements OnInit {
  posts: BlogPost[] = [];
  uniqueTags: string[] = [];
  selectedTag = signal<string | null>(null);
  filteredPosts: BlogPost[] = [];

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.posts = this.blogService.getPublishedPosts();
    this.extractUniqueTags();
    this.filterPosts();
  }

  private extractUniqueTags(): void {
    const tags = new Set<string>();
    this.posts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag));
    });
    this.uniqueTags = Array.from(tags).sort();
  }

  private filterPosts(): void {
    const tag = this.selectedTag();
    if (tag) {
      this.filteredPosts = this.posts.filter(post => post.tags.includes(tag));
    } else {
      this.filteredPosts = this.posts;
    }
  }

  selectTag(tag: string | null): void {
    this.selectedTag.set(tag);
    this.filterPosts();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
