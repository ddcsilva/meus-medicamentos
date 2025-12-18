/**
 * Configurações de Segurança para Autenticação
 * 
 * Este arquivo centraliza todas as configurações relacionadas à segurança
 * e comportamento da autenticação na aplicação.
 */

/**
 * Tipo de persistência da sessão de autenticação
 * 
 * - 'local': Mantém sessão mesmo após fechar o navegador (padrão para "lembrar-me")
 * - 'session': Sessão expira ao fechar a aba/navegador (mais seguro)
 * - 'none': Sem persistência, apenas na memória (máxima segurança, requer re-login frequente)
 */
export type AuthPersistenceType = 'local' | 'session' | 'none';

/**
 * Interface de configuração de autenticação
 */
export interface AuthConfig {
  persistence: AuthPersistenceType;
  sessionTimeoutMinutes: number | null;
  requireEmailVerification: boolean;
  enableMFA: boolean;
  maxLoginAttempts: number | null;
  lockoutDurationMinutes: number;
  allowedRedirectUrls: string[];
}

/**
 * Configuração padrão de autenticação
 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  persistence: 'local',
  sessionTimeoutMinutes: null,
  requireEmailVerification: false,
  enableMFA: false,
  maxLoginAttempts: null,
  lockoutDurationMinutes: 15,
  allowedRedirectUrls: [
    'http://localhost:4200',
    'http://localhost:5000',
  ],
};

/**
 * Configuração para ambientes de produção (mais restritiva)
 */
export const PRODUCTION_AUTH_CONFIG: AuthConfig = {
  ...DEFAULT_AUTH_CONFIG,
  persistence: 'session',
  sessionTimeoutMinutes: 30,
  requireEmailVerification: true,
  enableMFA: false,
};
