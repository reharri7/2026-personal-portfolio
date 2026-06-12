import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsletterService } from '../../services/newsletter.service';

/**
 * Landing page for the confirmation link in the subscription email. Reads ?token=,
 * calls the confirm API, and reports the outcome. Unsubscribe is handled by Resend's
 * own hosted page, so it has no route here.
 */
@Component({
  selector: 'app-newsletter-confirm',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-xl mx-auto px-4 py-24 text-center">
      @switch (state()) {
        @case ('loading') {
          <h1 class="text-2xl font-bold mb-3 text-secondary-900 dark:text-white">Confirming…</h1>
          <p class="text-secondary-600 dark:text-secondary-400">One moment while we confirm your subscription.</p>
        }
        @case ('success') {
          <h1 class="text-3xl font-bold mb-3 text-secondary-900 dark:text-white">You're subscribed! 🎉</h1>
          <p class="text-secondary-600 dark:text-secondary-400 mb-6">
            Thanks for confirming. You'll get an email when I publish new posts.
          </p>
          <a routerLink="/blog" class="btn btn-primary">Read the blog</a>
        }
        @case ('error') {
          <h1 class="text-2xl font-bold mb-3 text-secondary-900 dark:text-white">Link invalid or expired</h1>
          <p class="text-secondary-600 dark:text-secondary-400 mb-6">{{ message() }}</p>
          <a routerLink="/" class="btn btn-outline">Back home</a>
        }
      }
    </div>
  `,
  styles: []
})
export class NewsletterConfirmComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly newsletter = inject(NewsletterService);

  state = signal<'loading' | 'success' | 'error'>('loading');
  message = signal('');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      this.message.set('No confirmation token was provided.');
      return;
    }
    this.newsletter.confirm(token).subscribe({
      next: () => this.state.set('success'),
      error: (err) => {
        this.state.set('error');
        this.message.set(
          err?.error?.message ?? 'This confirmation link is no longer valid. Please subscribe again.'
        );
      }
    });
  }
}
