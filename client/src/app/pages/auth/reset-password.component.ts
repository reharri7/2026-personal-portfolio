import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Sets a new password using the token from the reset email link (?token=). */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="max-w-md w-full space-y-8">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-white">Choose a new password</h2>

        @if (done()) {
          <p class="text-center text-secondary-600 dark:text-secondary-400">Your password has been updated.</p>
          <div class="text-center">
            <a routerLink="/login" class="text-primary-600 dark:text-primary-400 hover:text-primary-500">Sign in</a>
          </div>
        } @else if (!token) {
          <p class="text-center text-red-600 dark:text-red-400">This reset link is missing its token. Please request a new one.</p>
          <div class="text-center">
            <a routerLink="/forgot-password" class="text-primary-600 dark:text-primary-400 hover:text-primary-500">Request a new link</a>
          </div>
        } @else {
          <form class="mt-8 space-y-6" (ngSubmit)="submit()">
            <div>
              <input
                [(ngModel)]="password"
                name="password"
                type="password"
                required
                minlength="8"
                [disabled]="loading()"
                placeholder="New password (8+ characters)"
                class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 placeholder-secondary-500 text-secondary-900 dark:text-white dark:bg-secondary-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            @if (error()) {
              <p class="text-red-600 dark:text-red-400 text-sm text-center">{{ error() }}</p>
            }
            <button
              type="submit"
              [disabled]="loading() || password.length < 8"
              class="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              {{ loading() ? 'Updating…' : 'Update password' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ResetPasswordComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly token = this.route.snapshot.queryParamMap.get('token');
  password = '';
  loading = signal(false);
  done = signal(false);
  error = signal('');

  submit(): void {
    if (!this.token || this.password.length < 8 || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.http.post(`${environment.apiUrl}/auth/reset-password`, { token: this.token, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'This reset link is invalid or has expired.');
      }
    });
  }
}
