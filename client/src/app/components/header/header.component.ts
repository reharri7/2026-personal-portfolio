import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <header class="bg-white dark:bg-secondary-800 shadow-md dark:shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <a routerLink="/" class="text-2xl font-bold text-gradient">Portfolio</a>
          </div>

          <button
            (click)="toggleMenu()"
            class="md:hidden btn btn-ghost btn-circle"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path [attr.stroke-linecap]="'round'" [attr.stroke-linejoin]="'round'" stroke-width="2"
                [attr.d]="isMenuOpen() ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"></path>
            </svg>
          </button>

          <nav class="hidden md:flex gap-8">
            <a routerLink="/" routerLinkActive="text-primary-600 dark:text-primary-500"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
              Home
            </a>
            <a routerLink="/about" routerLinkActive="text-primary-600 dark:text-primary-500"
              class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
              About
            </a>
            <a routerLink="/blog" routerLinkActive="text-primary-600 dark:text-primary-500"
              class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
              Blog
            </a>
            <a routerLink="/contact" routerLinkActive="text-primary-600 dark:text-primary-500"
              class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
              Contact
            </a>
            <a routerLink="/admin" routerLinkActive="text-primary-600 dark:text-primary-500"
              class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
              Admin
            </a>
          </nav>

          <button
            (click)="toggleTheme()"
            class="btn btn-ghost btn-circle"
          >
            @if(themeService.isDarkMode()) {
              <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm11.313 1.414a1 1 0 011.414-1.414l.707.707a1 1 0 11-1.414 1.414l-.707-.707zM4 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm12 0a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.22 15.78a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm11.313 1.414a1 1 0 011.414-1.414l.707.707a1 1 0 11-1.414 1.414l-.707-.707zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clip-rule="evenodd"></path>
              </svg>
            }
            @else {
            <svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
            </svg>
            }
          </button>
        </div>

        @if(isMenuOpen()) {
          <nav class="md:hidden pb-4">
            <div class="flex flex-col gap-4">
              <a routerLink="/" (click)="toggleMenu()" class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600">Home</a>
              <a routerLink="/about" (click)="toggleMenu()" class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600">About</a>
              <a routerLink="/blog" (click)="toggleMenu()" class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600">Blog</a>
              <a routerLink="/contact" (click)="toggleMenu()" class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600">Contact</a>
              <a routerLink="/admin" (click)="toggleMenu()" class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600">Admin</a>
            </div>
          </nav>
        }
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {
  isMenuOpen = signal(false);

  constructor(public themeService: ThemeService) {}

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
