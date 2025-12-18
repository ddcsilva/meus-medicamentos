import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  reload,
} from '@angular/fire/auth';
import { AuthGateway } from './auth-gateway.interface';
import { AppUser } from './user.model';

/**
 * Implementação do AuthGateway usando Firebase Authentication.
 * 
 * Esta é a única classe que conhece detalhes do Firebase.
 * Se migrarmos para outro provedor, criamos uma nova implementação
 * sem tocar no AuthService ou nos componentes.
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthGateway implements AuthGateway {
  private auth = inject(Auth);

  readonly authState$: Observable<AppUser | null> = authState(this.auth).pipe(
    map((user) => this.mapFirebaseUser(user))
  );

  async signInWithEmailAndPassword(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async createUserWithEmailAndPassword(email: string, password: string, displayName: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);

    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      await reload(credential.user);
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async signInWithSocialProvider(provider: 'google' | 'facebook' | 'apple'): Promise<void> {
    let authProvider;

    switch (provider) {
      case 'google':
        authProvider = new GoogleAuthProvider();
        break;
      default:
        throw new Error(`Provedor ${provider} não implementado`);
    }

    await signInWithPopup(this.auth, authProvider);
  }

  async reloadUser(): Promise<void> {
    if (this.auth.currentUser) {
      await reload(this.auth.currentUser);
    }
  }

  async updateUserProfile(updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    if (this.auth.currentUser) {
      await updateProfile(this.auth.currentUser, updates);
      await reload(this.auth.currentUser);
    }
  }

  /**
   * Converte o User do Firebase para o AppUser da aplicação
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
}
