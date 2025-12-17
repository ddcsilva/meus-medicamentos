import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "meus-medicamentos-94500", appId: "1:524455125423:web:bf95c329168ccb49f60f5a", storageBucket: "meus-medicamentos-94500.firebasestorage.app", apiKey: "AIzaSyDS9EjSQEEUbGouJDNjyoPYbTxIGieAtTg", authDomain: "meus-medicamentos-94500.firebaseapp.com", messagingSenderId: "524455125423", projectNumber: "524455125423", version: "2" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions()), provideStorage(() => getStorage()), provideFirebaseApp(() => initializeApp({ projectId: "meus-medicamentos-94500", appId: "1:524455125423:web:bf95c329168ccb49f60f5a", storageBucket: "meus-medicamentos-94500.firebasestorage.app", apiKey: "AIzaSyDS9EjSQEEUbGouJDNjyoPYbTxIGieAtTg", authDomain: "meus-medicamentos-94500.firebaseapp.com", messagingSenderId: "524455125423", projectNumber: "524455125423", version: "2" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions()), provideStorage(() => getStorage())
  ]
};
