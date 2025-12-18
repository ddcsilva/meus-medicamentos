import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  getAuth,
  provideAuth,
} from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';

/**
 * Configuração principal da aplicação (Angular 20+)
 * 
 * Segue as melhores práticas de segurança e performance:
 * - Firebase Auth inicializado de forma simples (persistência em FirebaseAuthGateway)
 * - Zone change detection otimizada com event coalescing
 * - Tratamento global de erros
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    
    // Configuração de Auth
    // Firebase usa browserLocalPersistence por padrão (mantém login após fechar navegador)
    provideAuth(() => getAuth()),
    
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage()),
  ],
};
