import { Timestamp } from '@angular/fire/firestore';

/**
 * Dados do Firebase Auth (token JWT)
 * Usado para autenticação e estado da sessão
 */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

/**
 * Dados do usuário no Firestore (/users/{uid})
 * Informações adicionais e estado de aprovação
 */
export interface User {
  uid: string;
  email: string;
  nome: string;
  status: UserStatus;
  familyId: string | null;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Estado do usuário no sistema
 */
export type UserStatus = 'pending' | 'approved' | 'rejected';

/**
 * Dados para criação de novo usuário
 */
export interface CreateUserData {
  uid: string;
  email: string;
  nome: string;
  photoURL?: string;
}

/**
 * Custom Claims do Firebase Auth (JWT)
 */
export interface UserClaims {
  isAdmin?: boolean;
}
