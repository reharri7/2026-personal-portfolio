import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-white">
            Create your account
          </h2>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm space-y-4">
            <div>
              <label for="displayName" class="sr-only">Display Name</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                [(ngModel)]="displayName"
                class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 placeholder-secondary-500 text-secondary-900 dark:text-white dark:bg-secondary-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Display Name"
              />
            </div>
            <div>
              <label for="email" class="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                [(ngModel)]="email"
                class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 placeholder-secondary-500 text-secondary-900 dark:text-white dark:bg-secondary-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                [(ngModel)]="password"
                class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 placeholder-secondary-500 text-secondary-900 dark:text-white dark:bg-secondary-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label for="confirmPassword" class="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                [(ngModel)]="confirmPassword"
                class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 placeholder-secondary-500 text-secondary-900 dark:text-white dark:bg-secondary-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          @if (errorMessage()) {
            <div class="text-red-600 dark:text-red-400 text-sm text-center">
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div class="text-green-600 dark:text-green-400 text-sm text-center">
              {{ successMessage() }}
            </div>
          }

          <div>
            <button
              type="submit"
              [disabled]="isLoading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
                <span>Creating account...</span>
              } @else {
                <span>Register</span>
              }
            </button>
          </div>

          <div class="text-center">
            <a routerLink="/login" class="text-primary-600 dark:text-primary-400 hover:text-primary-500">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {
  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.displayName || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage.set('All fields are required');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(this.email, this.password, this.displayName).subscribe({
      next: (success) => {
        this.isLoading.set(false);
        if (success) {
          this.successMessage.set('Registration successful! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage.set('Registration failed. Email may already be in use.');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Registration failed. Please try again.');
      }
    });
  }
}
