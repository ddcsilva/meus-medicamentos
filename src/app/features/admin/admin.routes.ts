import { Routes } from '@angular/router';

/**
 * Rotas da área administrativa
 * Todas requerem authGuard + adminGuard
 */
export default [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
    title: 'MedStock - Admin Dashboard',
  },
  {
    path: 'pending-users',
    loadComponent: () =>
      import('./pages/pending-users/pending-users').then((m) => m.PendingUsersComponent),
    title: 'MedStock - Usuários Pendentes',
  },
] as Routes;
