import { Component, inject, signal, computed } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { passwordMatchValidator } from '../../validators/password-match';
import { strongPasswordValidator, getWeakPasswordMessage, WeakPasswordError } from '../../validators/strong-password.validator';

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

  // Feedback visual de loading global
  readonly globalLoading = this.authService.isLoading;

  registerForm = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  // Computed signals para melhor UX
  get passwordControl() {
    return this.registerForm.controls.password;
  }

  passwordWeakMessage = computed(() => {
    const error = this.passwordControl.errors?.['weakPassword'] as WeakPasswordError['weakPassword'] | undefined;
    if (!error || !this.passwordControl.touched) return null;
    
    return getWeakPasswordMessage({ weakPassword: error });
  });

  async onSubmit() {
    if (this.registerForm.invalid) return;

    // Previne double-submit usando loading global
    if (this.globalLoading()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password, fullName } = this.registerForm.getRawValue();

    try {
      await this.authService.register(email, password, fullName);
      this.router.navigate(['/app/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Ocorreu um erro inesperado.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
