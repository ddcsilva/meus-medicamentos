import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take, tap } from 'rxjs/operators';
import { Auth, authState } from '@angular/fire/auth';

/**
 * Guardião funcional (Functional Guard) para Angular 20+
 * Verifica se o usuário está logado antes de deixar entrar em rotas protegidas (/app)
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(Auth);

  return authState(auth).pipe(
    take(1),
    map((user) => !!user),
    tap((isLoggedIn) => {
      if (!isLoggedIn) {
        router.navigate(['/auth/login']);
      }
    })
  );
};
