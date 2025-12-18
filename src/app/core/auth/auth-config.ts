export type AuthPersistenceType = 'local' | 'session' | 'none';

export interface AuthConfig {
  persistence: AuthPersistenceType;
  sessionTimeoutMinutes: number | null;
  requireEmailVerification: boolean;
  enableMFA: boolean;
  maxLoginAttempts: number | null;
  lockoutDurationMinutes: number;
  allowedRedirectUrls: string[];
}

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

export const PRODUCTION_AUTH_CONFIG: AuthConfig = {
  ...DEFAULT_AUTH_CONFIG,
  persistence: 'session',
  sessionTimeoutMinutes: 30,
  requireEmailVerification: true,
  enableMFA: false,
};
