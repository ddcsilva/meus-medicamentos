import { Environment } from './environment.interface';

/**
 * Arquivo de exemplo para configuração de ambiente
 * 
 * INSTRUÇÕES:
 * 1. Copie este arquivo para environment.ts
 * 2. Preencha as credenciais do seu projeto Firebase
 * 3. Para produção, copie para environment.prod.ts e ajuste conforme necessário
 */
export const environment: Environment = {
  production: false,
  firebase: {
    projectId: 'seu-project-id',
    appId: 'seu-app-id',
    storageBucket: 'seu-storage-bucket',
    apiKey: 'sua-api-key',
    authDomain: 'seu-auth-domain',
    messagingSenderId: 'seu-messaging-sender-id',
  },
};

