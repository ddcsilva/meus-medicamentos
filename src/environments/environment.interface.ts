/**
 * Interface para tipagem das variáveis de ambiente
 * Baseado na interface FirebaseOptions do Firebase SDK
 */
export interface Environment {
  production: boolean;
  firebase: {
    projectId: string;
    appId: string;
    storageBucket: string;
    apiKey: string;
    authDomain: string;
    messagingSenderId: string;
  };
}

