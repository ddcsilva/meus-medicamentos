import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPasswordComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  
  isSubmitting = signal(false);
  emailSent = signal(false);
  errorMessage = signal<string | null>(null);

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async onSubmit() {
    if (this.resetForm.invalid) return;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email } = this.resetForm.getRawValue();

    try {
      await this.authService.recoverPassword(email);
      this.emailSent.set(true);
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Não foi possível enviar o e-mail. Verifique se o endereço está correto.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}