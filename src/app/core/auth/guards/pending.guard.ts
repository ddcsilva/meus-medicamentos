import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Guard para usuários com status 'pending'
 * Permite acesso apenas à tela de aguardando aprovação
 * Redireciona aprovados para family-setup ou dashboard
 */
export const pendingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const isPending = authService.isPending();
  const isApproved = authService.isApproved();
  const hasFamilyId = authService.hasFamilyId();

  if (!isAuthenticated) {
    return router.createUrlTree(['/auth/login']);
  }

  // Se está pending, permite acesso
  if (isPending) {
    return true;
  }

  // Se foi aprovado, redireciona baseado em ter família ou não
  if (isApproved) {
    if (hasFamilyId) {
      return router.createUrlTree(['/app/dashboard']);
    } else {
      return router.createUrlTree(['/auth/family-setup']);
    }
  }

  // Se foi rejeitado, redireciona para login
  return router.createUrlTree(['/auth/login']);
};
