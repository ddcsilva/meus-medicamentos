import { Component, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

/**
 * Página de aguardando aprovação do administrador
 * Exibida após cadastro, enquanto status='pending'
 * Detecta automaticamente quando o usuário é aprovado e redireciona
 */
@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [],
  templateUrl: './pending-approval.html',
  styleUrls: ['./pending-approval.css'],
})
export class PendingApprovalComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userEmail = this.authService.currentUser()?.email || '';

  constructor() {
    // Effect para detectar mudança de status
    effect(() => {
      const status = this.authService.userStatus();
      const hasFamilyId = this.authService.hasFamilyId();

      if (status === 'approved') {
        // Aprovado! Redireciona para family-setup ou dashboard
        if (hasFamilyId) {
          this.router.navigate(['/app/dashboard']);
        } else {
          this.router.navigate(['/auth/family-setup']);
        }
      } else if (status === 'rejected') {
        // Rejeitado, volta para login
        this.router.navigate(['/auth/login']);
      }
    });
  }

  async handleLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
