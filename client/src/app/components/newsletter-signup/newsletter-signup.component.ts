import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../services/newsletter.service';

/**
 * Compact email subscribe form (double opt-in). Posts to the public newsletter API and
 * shows an inline confirmation prompt. Designed to drop into the footer or blog list.
 */
@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <h3 class="text-xl font-bold mb-2">Subscribe</h3>
      <p class="text-secondary-400 mb-4 text-sm">Get an email when I publish new posts. No spam, unsubscribe any time.</p>

      @if (submitted()) {
        <p class="text-sm text-green-400" role="status">
          Almost there — check your inbox to confirm your subscription.
        </p>
      } @else {
        <form (ngSubmit)="submit()" class="flex gap-2 flex-wrap">
          <input
            [(ngModel)]="email"
            name="email"
            type="email"
            required
            [disabled]="loading()"
            class="flex-1 min-w-0 px-3 py-2 rounded-lg bg-secondary-800 border border-secondary-700 text-white placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            [disabled]="loading() || !email"
            class="btn btn-primary disabled:opacity-50">
            {{ loading() ? 'Subscribing…' : 'Subscribe' }}
          </button>
        </form>
        @if (error()) {
          <p class="text-sm text-red-400 mt-2" role="alert">{{ error() }}</p>
        }
      }
    </div>
  `,
  styles: []
})
export class NewsletterSignupComponent {
  private readonly newsletter = inject(NewsletterService);

  email = '';
  loading = signal(false);
  submitted = signal(false);
  error = signal('');

  submit(): void {
    if (!this.email || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.newsletter.subscribe(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.status === 429
            ? 'Too many attempts. Please try again later.'
            : 'Something went wrong. Please try again.'
        );
      }
    });
  }
}
