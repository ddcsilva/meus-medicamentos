import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/layout/auth-layout/auth-layout';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { authGuard } from './core/auth/auth-guard.guard';

/**
 * Configuração de Rotas - Angular 20+
 *
 * Arquitetura:
 * - / → Redireciona para /auth
 * - /auth → AuthLayout (login, registro, recuperação)
 * - /app → MainLayout (área autenticada com sidebar + header)
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
    ],
  },
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],
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
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
