import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MosaicPuzzle {
  id: number;
  slug: string;
  title: string;
  imageUrl: string;
  gridSize: number;
  published?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MosaicService {
  private readonly http = inject(HttpClient);
  private readonly publicUrl = `${environment.apiUrl}/public/mosaic`;
  private readonly adminUrl = `${environment.apiUrl}/admin/mosaic`;

  // ---- Public reads ----
  getPublished(): Observable<MosaicPuzzle[]> {
    return this.http.get<MosaicPuzzle[]>(this.publicUrl);
  }

  getBySlug(slug: string): Observable<MosaicPuzzle> {
    return this.http.get<MosaicPuzzle>(`${this.publicUrl}/${slug}`);
  }

  // ---- Admin ----
  getAll(): Observable<MosaicPuzzle[]> {
    return this.http.get<MosaicPuzzle[]>(this.adminUrl);
  }

  create(puzzle: Partial<MosaicPuzzle>): Observable<MosaicPuzzle> {
    return this.http.post<MosaicPuzzle>(this.adminUrl, puzzle);
  }

  update(id: number, puzzle: Partial<MosaicPuzzle>): Observable<MosaicPuzzle> {
    return this.http.put<MosaicPuzzle>(`${this.adminUrl}/${id}`, puzzle);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
