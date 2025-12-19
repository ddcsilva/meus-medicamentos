import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/layout/auth-layout/auth-layout';
import { MainLayout } from './core/layout/main-layout/main-layout';
import {
  authGuard,
  pendingGuard,
  approvedGuard,
  familyRequiredGuard,
  adminGuard,
} from './core/auth/guards';

/**
 * Configuração de Rotas - Angular 20+
 *
 * Arquitetura:
 * - / → Redireciona baseado em estado do usuário
 * - /auth → AuthLayout (login, registro, recuperação, pending, family-setup)
 * - /app → MainLayout (área autenticada com sidebar + header - requer família)
 * - /admin → Área administrativa (requer isAdmin claim)
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login').then((m) => m.LoginComponent),
        title: 'MedStock - Login',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register').then((m) => m.RegisterComponent),
        title: 'MedStock - Criar Conta',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password').then(
            (m) => m.ResetPasswordComponent
          ),
        title: 'MedStock - Recuperar Senha',
      },
      {
        path: 'pending-approval',
        loadComponent: () =>
          import('./features/auth/pages/pending-approval/pending-approval').then(
            (m) => m.PendingApprovalComponent
          ),
        canActivate: [authGuard, pendingGuard],
        title: 'MedStock - Aguardando Aprovação',
      },
      {
        path: 'family-setup',
        loadComponent: () =>
          import('./features/auth/pages/family-setup/family-setup').then(
            (m) => m.FamilySetupComponent
          ),
        canActivate: [authGuard, approvedGuard],
        title: 'MedStock - Configurar Família',
      },
    ],
  },
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard, familyRequiredGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'MedStock - Dashboard',
      },
      {
        path: 'medications',
        loadChildren: () => import('./features/medications/medications.routes'),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes'),
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
