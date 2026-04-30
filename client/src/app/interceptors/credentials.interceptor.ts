import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

let csrfPromise: Promise<{ headerName: string; token: string } | null> | null = null;

function fetchCsrfToken(): Promise<{ headerName: string; token: string } | null> {
  if (!csrfPromise) {
    csrfPromise = fetch(`${environment.apiUrl}/auth/csrf`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return csrfPromise;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const withCreds = req.clone({ withCredentials: true });

  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next(withCreds);
  }

  return from(fetchCsrfToken()).pipe(
    switchMap(csrf => {
      if (!csrf?.token) return next(withCreds);
      return next(withCreds.clone({ setHeaders: { [csrf.headerName]: csrf.token } }));
    })
  );
};

export const resetCsrfToken = () => {
  csrfPromise = null;
};
