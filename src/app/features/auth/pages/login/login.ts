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
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private handleError(error: any) {
    // Tratamento de erros seguro (evita enumeração de usuários)
    const code = error.code;
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      this.errorMessage.set('E-mail ou senha incorretos.');
    } else if (code === 'auth/too-many-requests') {
      this.errorMessage.set('Muitas tentativas. Tente novamente mais tarde.');
    } else {
      this.errorMessage.set('Ocorreu um erro inesperado. Verifique sua conexão.');
    }
  }
}
