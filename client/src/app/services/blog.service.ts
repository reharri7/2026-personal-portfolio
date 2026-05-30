import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverImageUrl?: string;
  date: string;
  published: boolean;
  authorName?: string;
  /** True when this post has an embedded Rherdle game configured. */
  rherdleEnabled?: boolean;
  /** Length of the embedded Rherdle word (public-safe; the word itself is server-only). */
  rherdleLength?: number;
  /** The secret word — only present on admin responses, used for editing. */
  rherdleWord?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly publicUrl = `${environment.apiUrl}/public/blog`;
  private readonly adminUrl = `${environment.apiUrl}/admin/blog`;

  posts = signal<BlogPost[]>([]);

  loadPublishedPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(this.publicUrl).pipe(
      tap(posts => this.posts.set(posts))
    );
  }

  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.publicUrl}/${slug}`);
  }

  getAllTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.publicUrl}/tags`);
  }

  getAllPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(this.adminUrl);
  }

  getPostById(id: number): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.adminUrl}/${id}`);
  }

  addPost(post: Partial<BlogPost>): Observable<BlogPost> {
    return this.http.post<BlogPost>(this.adminUrl, post);
  }

  updatePost(id: number, post: Partial<BlogPost>): Observable<BlogPost> {
    return this.http.put<BlogPost>(`${this.adminUrl}/${id}`, post);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
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
