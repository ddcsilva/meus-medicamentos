import { Injectable, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AppUser } from './user.model';
import { mapFirebaseAuthError } from './auth-error';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);

  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  private user$ = authState(this.auth).pipe(map((user) => this.mapFirebaseUser(user)));

  public currentUser = toSignal<AppUser | null>(this.user$);

  public isAuthenticated = computed(() => !!this.currentUser());

  /**
   * Converte o usuário do Firebase para o modelo interno AppUser
   */
  private mapFirebaseUser(user: User | null): AppUser | null {
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Realiza o login com E-mail e Senha
   */
  async login(email: string, pass: string): Promise<void> {
    this._isLoading.set(true);
    try {
      await signInWithEmailAndPassword(this.auth, email, pass);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Cria nova conta e atualiza o Nome de Exibição (DisplayName)
   * O Firebase CreateUser não salva o nome nativamente, precisamos fazer o updateProfile logo em seguida.
   */
  async register(email: string, pass: string, fullName: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);

      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName,
        });
      }
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Logout e limpeza de sessão
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);
    try {
      await signOut(this.auth);
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
    this._isLoading.set(true);
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Login com Google
   * Boas práticas: Pop-up é preferível em Desktop, Redirect em Mobile.
   */
  async loginWithGoogle(): Promise<void> {
    this._isLoading.set(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    } finally {
      this._isLoading.set(false);
    }
  }
}
