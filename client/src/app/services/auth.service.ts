import { Injectable, signal } from '@angular/core';
import { AuthControllerService } from '../api/api/authController.service';
import { catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal<boolean>(false);
  private currentUserSignal = signal<any>(null);

  isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  currentUser = this.currentUserSignal.asReadonly();

  constructor(private authController: AuthControllerService) {
    this.checkAuthStatus();
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
        this.checkAuthStatus();
        return true;
      }),
      catchError(() => of(false))
    );
  }

  logout() {
    return this.authController.logout().pipe(
      map(() => {
        this.isAuthenticatedSignal.set(false);
        this.currentUserSignal.set(null);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  checkAuthStatus() {
    this.authController.getCurrentUser().pipe(
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
