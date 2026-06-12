import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Requests a password reset link. Always reports success (non-enumerating). */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="max-w-md w-full space-y-8">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-white">Reset your password</h2>

        @if (sent()) {
          <p class="text-center text-secondary-600 dark:text-secondary-400">
            If an account exists for that email, a reset link is on its way. Check your inbox.
          </p>
          <div class="text-center">
            <a routerLink="/login" class="text-primary-600 dark:text-primary-400 hover:text-primary-500">Back to sign in</a>
          </div>
        } @else {
          <form class="mt-8 space-y-6" (ngSubmit)="submit()">
            <input
              [(ngModel)]="email"
              name="email"
              type="email"
              required
              [disabled]="loading()"
              placeholder="you@example.com"
              class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 placeholder-secondary-500 text-secondary-900 dark:text-white dark:bg-secondary-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            <button
              type="submit"
              [disabled]="loading() || !email"
              class="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              {{ loading() ? 'Sending…' : 'Send reset link' }}
            </button>
            <div class="text-center">
              <a routerLink="/login" class="text-sm text-secondary-500 dark:text-secondary-400 hover:text-primary-500">Back to sign in</a>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ForgotPasswordComponent {
  private readonly http = inject(HttpClient);

  email = '';
  loading = signal(false);
  sent = signal(false);

  submit(): void {
    if (!this.email || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email }).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      // Non-enumerating: show the same success state even on error.
      error: () => {
        this.loading.set(false);
        this.sent.set(true);
      }
    });
  }
}
