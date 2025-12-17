import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/layout/auth-layout/auth-layout';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { 
        path: 'login', 
        loadComponent: () => import('./features/auth/pages/login/login').then(m => m.LoginComponent),
        title: 'MedStock - Login'
      },
      { 
        path: 'register', 
        loadComponent: () => import('./features/auth/pages/register/register').then(m => m.RegisterComponent),
        title: 'MedStock - Criar Conta'
      },
      { 
        path: 'reset-password', 
        loadComponent: () => import('./features/auth/pages/reset-password/reset-password').then(m => m.ResetPasswordComponent),
        title: 'MedStock - Recuperar Senha'
      }
    ]
  }
];