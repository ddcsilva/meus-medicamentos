import { AbstractControl, ValidatorFn } from '@angular/forms';

export interface PasswordMismatchError {
  passwordMismatch: true;
}

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): PasswordMismatchError | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;

  if (!confirmPassword.touched) return null;

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};
