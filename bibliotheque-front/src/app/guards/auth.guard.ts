import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  const token = localStorage.getItem('token');
  if (!token) {
    return router.createUrlTree(['/login']);
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === 'ADMIN') {
      return true;
    }
  } catch {
    // ignore invalid token
  }
  return router.createUrlTree(['/dashboard']);
};
