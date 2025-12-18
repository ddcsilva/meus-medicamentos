import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { AUTH_ROUTES } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  getAuth,
  provideAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';
import { DEFAULT_AUTH_CONFIG, PRODUCTION_AUTH_CONFIG } from './core/auth/auth-config';

/**
 * Configuração principal da aplicação (Angular 20+)
 * 
 * Segue as melhores práticas de segurança e performance:
 * - Configuração de persistência explícita (desenvolvimento vs produção)
 * - Zone change detection otimizada com event coalescing
 * - Tratamento global de erros
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(AUTH_ROUTES),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    
    // Configuração de Auth com persistência baseada no ambiente
    provideAuth(() => {
      const auth = getAuth();
      
      // Aplica configurações de segurança conforme ambiente
      const authConfig = isDevMode() ? DEFAULT_AUTH_CONFIG : PRODUCTION_AUTH_CONFIG;
      
      // Define tipo de persistência
      const persistence =
        authConfig.persistence === 'local'
          ? browserLocalPersistence
          : browserSessionPersistence;

      setPersistence(auth, persistence).catch((error) => {
        console.error('Erro ao configurar persistência de autenticação:', error);
      });

      return auth;
    }),
    
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage()),
  ],
};
