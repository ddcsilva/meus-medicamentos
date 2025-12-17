/**
 * Classe de erro customizada para operações de autenticação
 * Encapsula erros do Firebase e fornece mensagens amigáveis
 */
export class AuthError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly originalError?: any
  ) {
    super(userMessage);
    this.name = 'AuthError';
  }
}

/**
 * Mapeia códigos de erro do Firebase para mensagens amigáveis em português
 */
export function mapFirebaseAuthError(error: any): AuthError {
  const code = error?.code || 'unknown';

  const errorMessages: Record<string, string> = {
    // Erros de Login
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Esta conta foi desabilitada. Entre em contato com o suporte.',
    
    // Erros de Registro
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/operation-not-allowed': 'Operação não permitida. Contate o suporte.',
    
    // Erros de Recuperação de Senha
    'auth/invalid-action-code': 'Link de recuperação inválido ou expirado.',
    'auth/expired-action-code': 'Link de recuperação expirado. Solicite um novo.',
    
    // Erros de Rate Limiting
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
    
    // Erros de Rede
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet e tente novamente.',
    
    // Erro genérico
    'unknown': 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
  };

  const userMessage = errorMessages[code] || errorMessages['unknown'];

  return new AuthError(code, userMessage, error);
}
