import { Injectable, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser } from './user.model';
import { mapFirebaseAuthError } from './auth-error';
import { AuthGateway } from './auth-gateway.interface';
import { FirebaseAuthGateway } from './firebase-auth-gateway';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private gateway = inject<AuthGateway>(FirebaseAuthGateway);

  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  public currentUser = toSignal<AppUser | null>(this.gateway.authState$);
  public isAuthenticated = computed(() => !!this.currentUser());

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
      await this.gateway.createUserWithEmailAndPassword(email, password, fullName);
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
