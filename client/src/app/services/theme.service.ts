import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // On the server, default to light mode without touching DOM or storage
      this.isDarkMode.set(false);
      return;
    }

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (saved === null && prefersDark);

    this.isDarkMode.set(isDark);
    this.applyTheme(isDark);
  }

  toggleTheme(): void {
    const newMode = !this.isDarkMode();
    this.isDarkMode.set(newMode);
    this.applyTheme(newMode);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
    }
  }

  private applyTheme(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
