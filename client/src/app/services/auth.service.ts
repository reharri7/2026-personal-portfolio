import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthControllerService } from '../api/api/authController.service';
import { catchError, map, of } from 'rxjs';
import { resetCsrfToken } from '../interceptors/credentials.interceptor';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private isAuthenticatedSignal = signal<boolean>(false);
  private currentUserSignal = signal<any>(null);

  isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  currentUser = this.currentUserSignal.asReadonly();

  constructor(private authController: AuthControllerService) {
    // Only resolve auth in the browser: during SSR the user's session cookie
    // isn't forwarded, so the server always looks logged out.
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthStatus();
    }
  }

  register(email: string, password: string, displayName: string) {
    return this.authController.register({ email, password, displayName }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  login(email: string, password: string) {
    return this.authController.login({ email, password }).pipe(
      map(() => {
        resetCsrfToken();
        this.checkAuthStatus();
        return true;
      }),
      catchError(() => of(false))
    );
  }

  logout() {
    return this.authController.logout().pipe(
      map(() => {
        resetCsrfToken();
        this.isAuthenticatedSignal.set(false);
        this.currentUserSignal.set(null);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  checkAuthStatus() {
    // transferCache:false forces a live network call on the client instead of
    // replaying the SSR (logged-out) response from the hydration transfer cache.
    this.authController.getCurrentUser('body', false, { transferCache: false }).pipe(
      map(user => {
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(user);
      }),
      catchError(() => {
        this.isAuthenticatedSignal.set(false);
        this.currentUserSignal.set(null);
        return of(null);
      })
    ).subscribe();
  }
}
