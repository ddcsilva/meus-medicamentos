import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Functional Guard para proteger rotas que requerem autenticação.
 * 
 * Princípios aplicados:
 * - Desacoplado do provedor (usa AuthService, não Firebase diretamente)
 * - Usa Signal do AuthService (mais performático que Observable)
 * - Redireciona para login preservando a URL de destino (queryParams)
 * 
 * @example
 * ```typescript
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 * ```
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usa Signal diretamente (mais performático que Observable)
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Preserva a URL de destino para redirecionar após login
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  return true;
};
