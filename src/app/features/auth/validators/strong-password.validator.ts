import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Interface tipada para o erro de senha fraca.
 * 
 * Seguindo best practices do Angular, definimos uma interface
 * específica para o erro retornado pelo validador.
 */
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

/**
 * Validador de senha forte com tipagem estrita.
 * 
 * Requisitos implementados:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula (A-Z)
 * - Pelo menos 1 letra minúscula (a-z)
 * - Pelo menos 1 número (0-9)
 * - Pelo menos 1 caractere especial (@$!%*?&#)
 * 
 * Benefícios:
 * - Tipagem estrita (retorna WeakPasswordError | null)
 * - Feedback detalhado (lista o que está faltando)
 * - Reutilizável em qualquer formulário
 * 
 * @example
 * ```typescript
 * registerForm = this.fb.group({
 *   password: ['', [Validators.required, strongPasswordValidator()]]
 * });
 * 
 * // No template
 * @if (passwordControl.hasError('weakPassword')) {
 *   <p>Senha deve conter: {{ passwordControl.errors.weakPassword.missing.join(', ') }}</p>
 * }
 * ```
 */
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): WeakPasswordError | null => {
    const value = control.value || '';

    // Requisitos de senha forte
    const minLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[@$!%*?&#]/.test(value);

    const allRequirementsMet =
      minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    if (allRequirementsMet) {
      return null; // Senha válida
    }

    // Monta lista de requisitos faltantes
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

/**
 * Helper function para obter mensagem de erro amigável.
 * 
 * @param error Erro retornado pelo validador
 * @returns Mensagem formatada para exibir ao usuário
 */
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
