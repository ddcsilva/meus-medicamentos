import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Estado Reativo com Signals
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get emailControl() { return this.loginForm.controls.email; }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    try {
      await this.authService.login(email, password);
      this.router.navigate(['/app/dashboard']);
    } catch (error: any) {
      // O AuthService já retorna uma mensagem amigável via AuthError
      this.errorMessage.set(error.message || 'Ocorreu um erro inesperado.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
