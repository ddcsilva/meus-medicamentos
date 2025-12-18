import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface WeakPasswordError {
  weakPassword: {
    missing: string[];
    requirements: {
      minLength: boolean;
      hasUpperCase: boolean;
      hasLowerCase: boolean;
      hasNumber: boolean;
      hasSpecialChar: boolean;
    };
  };
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): WeakPasswordError | null => {
    const value = control.value || '';

    const minLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[@$!%*?&#]/.test(value);

    const allRequirementsMet =
      minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    if (allRequirementsMet) {
      return null;
    }

    const missing: string[] = [];
    if (!minLength) missing.push('mínimo 8 caracteres');
    if (!hasUpperCase) missing.push('uma letra maiúscula');
    if (!hasLowerCase) missing.push('uma letra minúscula');
    if (!hasNumber) missing.push('um número');
    if (!hasSpecialChar) missing.push('um caractere especial (@$!%*?&#)');

    return {
      weakPassword: {
        missing,
        requirements: {
          minLength,
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSpecialChar,
        },
      },
    };
  };
}

export function getWeakPasswordMessage(error: WeakPasswordError): string {
  const { missing } = error.weakPassword;
  
  if (missing.length === 0) return '';
  
  if (missing.length === 1) {
    return `A senha precisa conter ${missing[0]}.`;
  }
  
  const lastItem = missing[missing.length - 1];
  const otherItems = missing.slice(0, -1).join(', ');
  
  return `A senha precisa conter ${otherItems} e ${lastItem}.`;
}
