import { Injectable, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser } from './user.model';
import { mapFirebaseAuthError } from './auth-error';
import { AuthGateway } from './auth-gateway.interface';
import { FirebaseAuthGateway } from './firebase-auth-gateway';

/**
 * Serviço principal de autenticação da aplicação.
 * 
 * Segue o Princípio da Inversão de Dependência (SOLID):
 * - Depende de uma abstração (AuthGateway), não de uma implementação concreta
 * - Pode usar Firebase, AWS Cognito ou qualquer outro provedor sem alteração
 * 
 * Responsabilidades:
 * - Gerenciar estado global de autenticação (currentUser, isAuthenticated, isLoading)
 * - Orquestrar operações de autenticação via AuthGateway
 * - Tratar e mapear erros para mensagens amigáveis
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private gateway = inject<AuthGateway>(FirebaseAuthGateway);

  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  public currentUser = toSignal<AppUser | null>(this.gateway.authState$);
  public isAuthenticated = computed(() => !!this.currentUser());

  /**
   * Realiza o login com E-mail e Senha
   */
  async login(email: string, password: string): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.gateway.signInWithEmailAndPassword(email, password);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Cria nova conta de usuário
   */
  async register(email: string, password: string, fullName: string): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.gateway.createUserWithEmailAndPassword(email, password, fullName);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Encerra a sessão do usuário atual
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.gateway.signOut();
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Envia e-mail de recuperação de senha
   */
  async recoverPassword(email: string): Promise<void> {
    if (!this.isValidEmailFormat(email)) {
      throw mapFirebaseAuthError({ code: 'auth/invalid-email' });
    }

    this._isLoading.set(true);
    try {
      await this.gateway.sendPasswordResetEmail(email);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Login com provedor social (Google, Facebook, etc.)
   */
  async loginWithSocial(provider: 'google' | 'facebook' | 'apple'): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.gateway.signInWithSocialProvider(provider);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Atualiza o perfil do usuário autenticado
   */
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.gateway.updateUserProfile(updates);
      await this.gateway.reloadUser();
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Valida formato de e-mail
   */
  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
