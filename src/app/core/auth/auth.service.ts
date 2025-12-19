import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser, User } from './user.model';
import { mapFirebaseAuthError } from './auth-error';
import { AuthGateway } from './auth-gateway.interface';
import { FirebaseAuthGateway } from './firebase-auth-gateway';
import { UserService } from './user.service';
import { switchMap, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private gateway = inject<AuthGateway>(FirebaseAuthGateway);
  private userService = inject(UserService);

  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  // Usuário do Firebase Auth (token)
  public currentUser = toSignal<AppUser | null>(this.gateway.authState$);
  public isAuthenticated = computed(() => !!this.currentUser());

  // Dados completos do usuário do Firestore
  public userData = toSignal<User | undefined>(
    this.gateway.authState$.pipe(
      switchMap((user) => {
        if (!user) return of(undefined);
        return this.userService.getUserData$(user.uid);
      })
    )
  );

  // Estados derivados
  public userStatus = computed(() => this.userData()?.status ?? null);
  public hasFamilyId = computed(() => !!this.userData()?.familyId);
  public isApproved = computed(() => this.userStatus() === 'approved');
  public isPending = computed(() => this.userStatus() === 'pending');
  public isRejected = computed(() => this.userStatus() === 'rejected');

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

  async register(email: string, password: string, fullName: string): Promise<void> {
    this._isLoading.set(true);
    try {
      // 1. Cria usuário no Firebase Auth
      await this.gateway.createUserWithEmailAndPassword(email, password, fullName);

      // 2. Aguarda o usuário estar disponível
      const user = this.currentUser();
      if (!user) {
        throw new Error('Usuário não encontrado após criação');
      }

      // 3. Cria documento no Firestore com status 'pending'
      await this.userService.createUserDocument({
        uid: user.uid,
        email: user.email || email,
        nome: fullName,
        photoURL: user.photoURL || undefined,
      });
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

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

  async loginWithSocial(provider: 'google' | 'facebook' | 'apple'): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.gateway.signInWithSocialProvider(provider);

      // Aguarda o usuário estar disponível
      const user = this.currentUser();
      if (!user) {
        throw new Error('Usuário não encontrado após login social');
      }

      // Verifica se já existe documento no Firestore
      // Se não existir, cria (novo usuário via social)
      const userData = this.userData();
      if (!userData) {
        await this.userService.createUserDocument({
          uid: user.uid,
          email: user.email || '',
          nome: user.displayName || 'Usuário',
          photoURL: user.photoURL || undefined,
        });
      }
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

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

  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
