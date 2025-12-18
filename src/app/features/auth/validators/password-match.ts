import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Interface tipada para o erro de senhas não correspondentes.
 * 
 * Seguindo TypeScript best practices, definimos uma interface
 * específica para o erro retornado pelo validador.
 */
export interface PasswordMismatchError {
  passwordMismatch: true;
}

/**
 * Validador que verifica se as senhas digitadas são iguais.
 * 
 * Implementado com tipagem estrita para melhor IntelliSense
 * e type-safety em todo o projeto.
 * 
 * @example
 * ```typescript
 * registerForm = this.fb.group({
 *   password: ['', Validators.required],
 *   confirmPassword: ['', Validators.required]
 * }, { validators: passwordMatchValidator });
 * 
 * // No template
 * @if (registerForm.hasError('passwordMismatch')) {
 *   <p>As senhas não coincidem</p>
 * }
 * ```
 */
export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): PasswordMismatchError | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  // Não valida se algum dos campos não existe
  if (!password || !confirmPassword) return null;

  // Não valida se o campo confirmPassword ainda não foi tocado
  // (evita erro prematuro enquanto o usuário digita)
  if (!confirmPassword.touched) return null;

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};
