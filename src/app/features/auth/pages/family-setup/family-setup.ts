import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { FamilyService } from '../../../family/services/family.service';

/**
 * Página de configuração de família
 * Permite criar nova família ou entrar em uma existente
 */
@Component({
  selector: 'app-family-setup',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './family-setup.html',
  styleUrls: ['./family-setup.css'],
})
export class FamilySetupComponent {
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  mode = signal<'choose' | 'create' | 'join'>('choose');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  createdInviteCode = signal<string | null>(null);

  createForm: FormGroup = this.fb.group({
    familyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
  });

  joinForm: FormGroup = this.fb.group({
    inviteCode: [
      '',
      [Validators.required, Validators.pattern(/^FAM-[A-Z0-9]{6}$/i)],
    ],
  });

  get currentUser() {
    return this.authService.currentUser();
  }

  selectMode(mode: 'create' | 'join'): void {
    this.mode.set(mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  back(): void {
    this.mode.set('choose');
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.createdInviteCode.set(null);
    this.createForm.reset();
    this.joinForm.reset();
  }

  async handleCreateFamily(): Promise<void> {
    if (this.createForm.invalid || !this.currentUser) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const familyName = this.createForm.value.familyName;
      const userId = this.currentUser.uid;

      const family = await this.familyService.createFamily({
        familyName,
        createdBy: userId,
      });

      this.createdInviteCode.set(family.inviteCode);
      this.successMessage.set('Família criada com sucesso!');

      // Aguarda 3 segundos para mostrar o código e redireciona
      setTimeout(() => {
        this.router.navigate(['/app/dashboard']);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao criar família:', error);
      this.errorMessage.set(error.message || 'Erro ao criar família. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleJoinFamily(): Promise<void> {
    if (this.joinForm.invalid || !this.currentUser) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const inviteCode = this.joinForm.value.inviteCode.toUpperCase();
      const userId = this.currentUser.uid;

      await this.familyService.joinFamily({
        inviteCode,
        userId,
      });

      this.successMessage.set('Você entrou na família com sucesso!');

      // Redireciona para o dashboard
      setTimeout(() => {
        this.router.navigate(['/app/dashboard']);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao entrar na família:', error);
      this.errorMessage.set(error.message || 'Erro ao entrar na família. Verifique o código.');
    } finally {
      this.isLoading.set(false);
    }
  }

  formatInviteCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    if (!value.startsWith('FAM-') && value.length > 0) {
      value = 'FAM-' + value.replace('FAM', '');
    }

    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    this.joinForm.patchValue({ inviteCode: value });
  }

  copyInviteCode(): void {
    const code = this.createdInviteCode();
    if (code) {
      navigator.clipboard.writeText(code);
      alert('Código copiado para a área de transferência!');
    }
  }

  async handleLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
