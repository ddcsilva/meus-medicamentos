import { Component, inject, signal, computed } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPasswordComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  
  isSubmitting = signal(false);
  emailSent = signal(false);
  errorMessage = signal<string | null>(null);
  canResend = signal(true);
  resendCountdown = signal(0);

  // Feedback visual de loading global
  readonly globalLoading = this.authService.isLoading;

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get emailControl() {
    return this.resetForm.controls.email;
  }

  emailHasError = computed(() => {
    return this.emailControl.invalid && this.emailControl.touched;
  });

  async onSubmit() {
    if (this.resetForm.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email } = this.resetForm.getRawValue();

    try {
      await this.authService.recoverPassword(email);
      this.emailSent.set(true);
      this.startResendCooldown();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Não foi possível enviar o e-mail.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Reenvia o e-mail de recuperação (com cooldown de 60 segundos)
   */
  async resendEmail() {
    if (!this.canResend()) return;
    
    this.errorMessage.set(null);
    await this.onSubmit();
  }

  /**
   * Inicia cooldown de 60 segundos antes de permitir novo envio
   */
  private startResendCooldown() {
    this.canResend.set(false);
    this.resendCountdown.set(60);

    const interval = setInterval(() => {
      const current = this.resendCountdown();
      if (current <= 1) {
        this.canResend.set(true);
        this.resendCountdown.set(0);
        clearInterval(interval);
      } else {
        this.resendCountdown.set(current - 1);
      }
    }, 1000);
  }
}