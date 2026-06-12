import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Subscriber {
  email: string;
  createdAt: string;
  unsubscribed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private readonly http = inject(HttpClient);
  private readonly publicUrl = `${environment.apiUrl}/public/newsletter`;
  private readonly adminUrl = `${environment.apiUrl}/admin/newsletter`;

  /** Begin double opt-in: triggers a confirmation email. */
  subscribe(email: string): Observable<void> {
    return this.http.post<void>(`${this.publicUrl}/subscribe`, { email });
  }

  /** Complete subscription using the token from the confirmation email link. */
  confirm(token: string): Observable<void> {
    return this.http.post<void>(`${this.publicUrl}/confirm`, { token });
  }

  /** Admin: live subscriber list from Resend. */
  getSubscribers(): Observable<Subscriber[]> {
    return this.http.get<Subscriber[]>(`${this.adminUrl}/subscribers`);
  }

  /** Admin: compose and send a newsletter broadcast. */
  sendNewsletter(subject: string, html: string): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/send`, { subject, html });
  }
}
