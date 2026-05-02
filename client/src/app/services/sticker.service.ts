import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type StickerStatus = 'pending' | 'approved' | 'rejected';

export interface Sticker {
  id: number;
  imageUrl: string | null;
  blurDataUrl: string | null;
  username: string;
  message: string | null;
  effect: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  alphaMask: string | null;
  status: StickerStatus;
  createdAt: string | null;
  approvedAt: string | null;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface SubmitStickerInput {
  image: File;
  username: string;
  message?: string | null;
  effect?: string | null;
  x: number;
  y: number;
  rotation: number;
  width: number;
}

@Injectable({ providedIn: 'root' })
export class StickerService {
  private readonly http = inject(HttpClient);
  private readonly publicUrl = `${environment.apiUrl}/public/stickers`;
  private readonly adminUrl = `${environment.apiUrl}/admin/stickers`;

  stickers = signal<Sticker[]>([]);

  loadViewport(b: ViewportBounds): Observable<Sticker[]> {
    const params = new HttpParams()
      .set('minX', b.minX)
      .set('minY', b.minY)
      .set('maxX', b.maxX)
      .set('maxY', b.maxY);
    return this.http.get<Sticker[]>(this.publicUrl, { params }).pipe(
      tap((rows) => this.mergeStickers(rows))
    );
  }

  preview(image: File): Observable<{
    imageDataUrl: string;
    width: number;
    height: number;
    alphaMask: string | null;
    blurDataUrl: string | null;
  }> {
    const fd = new FormData();
    fd.append('image', image);
    return this.http.post<any>(`${this.publicUrl}/preview`, fd);
  }

  submit(input: SubmitStickerInput): Observable<Sticker> {
    const fd = new FormData();
    fd.append('image', input.image);
    fd.append('username', input.username);
    if (input.message) fd.append('message', input.message);
    if (input.effect) fd.append('effect', input.effect);
    fd.append('x', String(input.x));
    fd.append('y', String(input.y));
    fd.append('rotation', String(input.rotation));
    fd.append('width', String(input.width));
    return this.http.post<Sticker>(this.publicUrl, fd);
  }

  listPending(): Observable<Sticker[]> {
    return this.http.get<Sticker[]>(this.adminUrl);
  }

  listAll(): Observable<Sticker[]> {
    return this.http.get<Sticker[]>(this.adminUrl, { params: { status: 'all' } });
  }

  moderate(id: number, status: 'approved' | 'rejected'): Observable<Sticker> {
    return this.http.patch<Sticker>(`${this.adminUrl}/${id}`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }

  private mergeStickers(incoming: Sticker[]): void {
    const map = new Map<number, Sticker>();
    for (const s of this.stickers()) map.set(s.id, s);
    for (const s of incoming) {
      // Public viewport responses strip image/username for pending stickers.
      // If we already have richer data locally (e.g. from the submission
      // response), keep those fields rather than overwriting with nulls.
      const existing = map.get(s.id);
      if (existing && s.status === 'pending' && !s.imageUrl && existing.imageUrl) {
        map.set(s.id, { ...s, imageUrl: existing.imageUrl, blurDataUrl: existing.blurDataUrl,
                         username: existing.username || s.username,
                         message: existing.message ?? s.message,
                         effect: existing.effect ?? s.effect });
      } else {
        map.set(s.id, s);
      }
    }
    this.stickers.set(Array.from(map.values()));
  }
}
