import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bg-white dark:bg-secondary-900 min-h-screen flex items-center justify-center">
      <div class="max-w-md text-center px-4">
        <h1 class="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 class="text-3xl font-bold text-secondary-900 dark:text-white mb-4">Page Not Found</h2>
        <p class="text-lg text-secondary-600 dark:text-secondary-400 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <a routerLink="/" class="btn btn-primary">Back to Home</a>
      </div>
    </div>
  `,
  styles: []
})
export class NotFoundComponent {}
