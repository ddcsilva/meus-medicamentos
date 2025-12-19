import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Guard para rotas que exigem usuário aprovado COM família
 * Usado no app principal (/app/*)
 * Redireciona para family-setup se aprovado mas sem família
 * Redireciona para pending se ainda não foi aprovado
 */
export const familyRequiredGuard: CanActivateFn = (route, state) => {
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

  // Se foi aprovado mas não tem família, redireciona para setup
  if (isApproved && !hasFamilyId) {
    return router.createUrlTree(['/auth/family-setup']);
  }

  // Se foi aprovado e tem família, permite acesso
  if (isApproved && hasFamilyId) {
    return true;
  }

  // Caso contrário, redireciona para login
  return router.createUrlTree(['/auth/login']);
};
