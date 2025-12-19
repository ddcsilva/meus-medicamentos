import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Guard para usuários aprovados SEM família
 * Usado na página de family-setup
 * Redireciona para dashboard se já tem família
 * Redireciona para pending se ainda não foi aprovado
 */
export const approvedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const isApproved = authService.isApproved();
  const isPending = authService.isPending();
  const hasFamilyId = authService.hasFamilyId();

  if (!isAuthenticated) {
    return router.createUrlTree(['/auth/login']);
  }

  // Se está pending, redireciona para tela de aguardando
  if (isPending) {
    return router.createUrlTree(['/auth/pending-approval']);
  }

  // Se foi aprovado e não tem família, permite acesso
  if (isApproved && !hasFamilyId) {
    return true;
  }

  // Se foi aprovado e já tem família, redireciona para dashboard
  if (isApproved && hasFamilyId) {
    return router.createUrlTree(['/app/dashboard']);
  }

  // Caso contrário, redireciona para login
  return router.createUrlTree(['/auth/login']);
};
