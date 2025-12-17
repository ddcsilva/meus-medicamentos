import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { passwordMatchValidator } from '../../validators/password-match';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  async onSubmit() {
    if (this.registerForm.invalid) return;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password, fullName } = this.registerForm.getRawValue();

    try {
      await this.authService.register(email, password, fullName);
      this.router.navigate(['/app/dashboard']);
    } catch (error: any) {
      // O AuthService já retorna uma mensagem amigável via AuthError
      this.errorMessage.set(error.message || 'Ocorreu um erro inesperado.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
