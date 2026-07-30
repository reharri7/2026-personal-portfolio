import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type BookStatus = 'READING' | 'FINISHED' | 'DNF';

export interface Book {
  id: number;
  title: string;
  author: string;
  coverImageUrl?: string | null;
  /** 0.5–5.0 in half steps; null for in-progress or abandoned books. */
  rating?: number | null;
  review?: string | null;
  /** Short, punchy one-liner shown on the card. */
  hotTake?: string | null;
  genre?: string | null;
  pageCount?: number | null;
  status: BookStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  sortOrder?: number | null;
}

export interface BookStats {
  totalBooks: number;
  booksThisYear: number;
  totalPages: number;
  pagesThisYear: number;
  averageRating?: number | null;
  favoriteGenre?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly publicUrl = `${environment.apiUrl}/public/books`;
  private readonly adminUrl = `${environment.apiUrl}/admin/books`;

  finished = signal<Book[]>([]);
  reading = signal<Book[]>([]);
  abandoned = signal<Book[]>([]);
  stats = signal<BookStats | null>(null);

  // ---- Public reads ----

  loadFinished(): Observable<Book[]> {
    return this.http.get<Book[]>(this.publicUrl).pipe(tap(b => this.finished.set(b)));
  }

  loadReading(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.publicUrl}/reading`).pipe(tap(b => this.reading.set(b)));
  }

  loadAbandoned(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.publicUrl}/abandoned`).pipe(tap(b => this.abandoned.set(b)));
  }

  loadStats(): Observable<BookStats> {
    return this.http.get<BookStats>(`${this.publicUrl}/stats`).pipe(tap(s => this.stats.set(s)));
  }

  // ---- Admin ----

  getAll(): Observable<Book[]> {
    return this.http.get<Book[]>(this.adminUrl);
  }

  create(book: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(this.adminUrl, book);
  }

  update(id: number, book: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.adminUrl}/${id}`, book);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
