import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService } from '../../services/admin.service';
import { User } from '../../../../core/auth/user.model';

/**
 * Página de gerenciamento de usuários pendentes
 */
@Component({
  selector: 'app-pending-users',
  standalone: true,
  imports: [],
  templateUrl: './pending-users.html',
  styleUrls: ['./pending-users.css'],
})
export class PendingUsersComponent {
  private adminService = inject(AdminService);

  pendingUsers = toSignal(this.adminService.getPendingUsers$());
  isLoading = this.adminService.isLoading;
  processingUserId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  async handleApprove(user: User): Promise<void> {
    this.processingUserId.set(user.uid);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.adminService.approveUser(user.uid);
      this.successMessage.set(`Usuário ${user.nome} aprovado com sucesso!`);

      // Limpa mensagem após 3 segundos
      setTimeout(() => {
        this.successMessage.set(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      this.errorMessage.set(error.message || 'Erro ao aprovar usuário');
    } finally {
      this.processingUserId.set(null);
    }
  }

  async handleReject(user: User): Promise<void> {
    if (!confirm(`Tem certeza que deseja rejeitar o usuário ${user.nome}?`)) {
      return;
    }

    this.processingUserId.set(user.uid);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.adminService.rejectUser(user.uid);
      this.successMessage.set(`Usuário ${user.nome} rejeitado.`);

      setTimeout(() => {
        this.successMessage.set(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error);
      this.errorMessage.set(error.message || 'Erro ao rejeitar usuário');
    } finally {
      this.processingUserId.set(null);
    }
  }

  isProcessing(uid: string): boolean {
    return this.processingUserId() === uid;
  }
}
