import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  date: string;
  published: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly STORAGE_KEY = 'blog_posts';
  posts = signal<BlogPost[]>([]);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    this.loadPosts();
  }

  private loadPosts(): void {
    if (!this.isBrowser) {
      // Avoid touching browser-only APIs during SSR
      this.initializeSamplePosts();
      return;
    }

    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.STORAGE_KEY)
      : null;

    if (stored) {
      this.posts.set(JSON.parse(stored));
    } else {
      this.initializeSamplePosts();
    }
  }

  private initializeSamplePosts(): void {
    const samplePosts: BlogPost[] = [
      {
        id: '1',
        title: 'Getting Started with Angular 21',
        slug: 'getting-started-angular-21',
        excerpt: 'Learn the fundamentals of Angular 21 and start building modern web applications.',
        content: 'Angular 21 brings exciting new features and improvements. In this comprehensive guide, we\'ll explore the latest enhancements including improved signals, better performance optimizations, and streamlined development experience. Whether you\'re new to Angular or upgrading from a previous version, this tutorial will guide you through all the essential concepts.\n\n## Key Features\n- Enhanced Signals API\n- Improved Performance\n- Better Developer Experience\n- TypeScript Support\n\nLet\'s dive deep into each of these features and understand how they can improve your development workflow.',
        tags: ['angular', 'typescript', 'web-development'],
        date: new Date().toISOString().split('T')[0],
        published: true
      },
      {
        id: '2',
        title: 'Building Responsive Layouts with Tailwind CSS',
        slug: 'responsive-tailwind-css',
        excerpt: 'Master Tailwind CSS and create beautiful responsive designs without writing custom CSS.',
        content: 'Tailwind CSS has revolutionized the way we approach styling in modern web development. This post covers everything you need to know about building responsive, accessible layouts using Tailwind\'s utility-first approach.\n\n## Why Tailwind CSS?\n- Utility-first Framework\n- Highly Customizable\n- Great Documentation\n- Large Community\n\nWe\'ll explore responsive design patterns, dark mode implementation, and best practices for organizing your styles in large applications.',
        tags: ['css', 'tailwind', 'responsive-design'],
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        published: true
      }
    ];

    this.posts.set(samplePosts);
    this.savePosts();
  }

  private savePosts(): void {
    if (!this.isBrowser) return; // Skip persistence during SSR
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.posts()));
  }

  getPublishedPosts(): BlogPost[] {
    return this.posts().filter(post => post.published).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  getPostBySlug(slug: string): BlogPost | undefined {
    return this.posts().find(post => post.slug === slug && post.published);
  }

  addPost(post: Omit<BlogPost, 'id'>): void {
    const id = Date.now().toString();
    const newPost: BlogPost = { ...post, id };
    this.posts.update(posts => [newPost, ...posts]);
    this.savePosts();
  }

  updatePost(id: string, post: Partial<BlogPost>): void {
    this.posts.update(posts =>
      posts.map(p => p.id === id ? { ...p, ...post } : p)
    );
    this.savePosts();
  }

  deletePost(id: string): void {
    this.posts.update(posts => posts.filter(p => p.id !== id));
    this.savePosts();
  }

  getAllPosts(): BlogPost[] {
    return this.posts();
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
