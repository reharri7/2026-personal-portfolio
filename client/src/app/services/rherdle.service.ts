import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RherdleMeta {
  puzzleDate: string;
  length: number;
  maxGuesses: number;
}

export type TileStatus = 'CORRECT' | 'PRESENT' | 'ABSENT';

export interface RherdleGuessRequest {
  mode: 'DAILY' | 'BLOG';
  slug?: string;
  guess: string;
}

export interface RherdleGuessResponse {
  accepted: boolean;
  reason?: string;
  statuses?: TileStatus[];
  won: boolean;
  /** Only present when the guess wins. */
  answer?: string;
}

export interface RherdleWord {
  id: number;
  word: string;
  scheduledDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class RherdleService {
  private readonly http = inject(HttpClient);
  private readonly publicUrl = `${environment.apiUrl}/public/rherdle`;
  private readonly adminUrl = `${environment.apiUrl}/admin/rherdle`;

  getDailyMeta(): Observable<RherdleMeta> {
    return this.http.get<RherdleMeta>(`${this.publicUrl}/daily`);
  }

  guess(req: RherdleGuessRequest): Observable<RherdleGuessResponse> {
    return this.http.post<RherdleGuessResponse>(`${this.publicUrl}/guess`, req);
  }

  // --- Admin pool management ---
  listWords(): Observable<RherdleWord[]> {
    return this.http.get<RherdleWord[]>(`${this.adminUrl}/words`);
  }

  addWords(words: string): Observable<RherdleWord[]> {
    return this.http.post<RherdleWord[]>(`${this.adminUrl}/words`, { words });
  }

  scheduleWord(id: number, date: string | null): Observable<RherdleWord> {
    return this.http.put<RherdleWord>(`${this.adminUrl}/words/${id}/schedule`, { date });
  }

  deleteWord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/words/${id}`);
  }
}
