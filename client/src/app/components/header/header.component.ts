import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Sun, Moon } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, LucideAngularModule],
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

          <nav class="hidden md:flex gap-8 items-center">
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
            @if (authService.isAuthenticated()) {
              <a routerLink="/admin" routerLinkActive="text-primary-600 dark:text-primary-500"
                class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
                Admin
              </a>
              <button
                (click)="logout()"
                class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
                Logout
              </button>
            } @else {
              <a routerLink="/login" routerLinkActive="text-primary-600 dark:text-primary-500"
                class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors">
                Login
              </a>
            }
          </nav>

          <button
            (click)="toggleTheme()"
            class="btn btn-ghost btn-circle"
          >
            @if(themeService.isDarkMode()) {
              <lucide-icon [img]="sunIcon" class="w-5 h-5 text-yellow-500"></lucide-icon>
            }
            @else {
              <lucide-icon [img]="moonIcon" class="w-5 h-5 text-gray-300"></lucide-icon>
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
              @if (authService.isAuthenticated()) {
                <a routerLink="/admin" (click)="toggleMenu()" class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600">Admin</a>
                <button (click)="logout()" class="text-left text-secondary-700 dark:text-secondary-300 hover:text-primary-600">Logout</button>
              } @else {
                <a routerLink="/login" (click)="toggleMenu()" class="text-secondary-700 dark:text-secondary-300 hover:text-primary-600">Login</a>
              }
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
  readonly sunIcon = Sun;
  readonly moonIcon = Moon;

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private router: Router
  ) {}

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
      this.isMenuOpen.set(false);
    });
  }
}
