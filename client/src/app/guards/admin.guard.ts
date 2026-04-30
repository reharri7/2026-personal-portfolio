import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface MeResponse {
  email?: string;
  authorities?: Array<{ authority?: string } | string>;
}

export const adminGuard: CanActivateFn = () => {
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return true;
  }

  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get<MeResponse>(`${environment.apiUrl}/auth/me`).pipe(
    map(user => {
      const isAdmin = (user?.authorities ?? []).some(a =>
        typeof a === 'string' ? a === 'ROLE_ADMIN' : a?.authority === 'ROLE_ADMIN'
      );
      return isAdmin ? true : router.createUrlTree(['/login']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
