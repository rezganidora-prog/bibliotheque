import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.getRole() === 'ADMIN') {
    return router.createUrlTree(['/admin']);
  }
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.getRole() === 'ADMIN') {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
