import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { from, map, of } from 'rxjs';

/**
 * Guard para verificar se o usuário é admin
 * Verifica Custom Claims do Firebase Auth
 * Redireciona para dashboard se não for admin
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.currentUser) {
    return router.createUrlTree(['/auth/login']);
  }

  // Obtém os custom claims do token JWT
  return from(auth.currentUser.getIdTokenResult()).pipe(
    map((idTokenResult) => {
      const isAdmin = idTokenResult.claims['isAdmin'] === true;

      if (isAdmin) {
        return true;
      }

      // Não é admin, redireciona para dashboard
      return router.createUrlTree(['/app/dashboard']);
    })
  );
};
