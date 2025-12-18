import { Observable } from 'rxjs';
import { AppUser } from './user.model';

export interface AuthGateway {
  readonly authState$: Observable<AppUser | null>;

  signInWithEmailAndPassword(email: string, password: string): Promise<void>;

  createUserWithEmailAndPassword(email: string, password: string, displayName: string): Promise<void>;

  signOut(): Promise<void>;

  sendPasswordResetEmail(email: string): Promise<void>;

  signInWithSocialProvider(provider: 'google' | 'facebook' | 'apple'): Promise<void>;

  reloadUser(): Promise<void>;

  updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void>;
}
