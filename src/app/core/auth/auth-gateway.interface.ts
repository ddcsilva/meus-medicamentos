import { Observable } from 'rxjs';
import { AppUser } from './user.model';

/**
 * Interface abstrata para operações de autenticação.
 *
 * Esta interface define o contrato que qualquer provedor de autenticação
 * (Firebase, AWS Cognito, Supabase, Auth0, etc.) deve implementar.
 *
 * Seguindo o Princípio da Inversão de Dependência (SOLID),
 * o AuthService depende desta abstração, não de uma implementação concreta.
 */
export interface AuthGateway {
  readonly authState$: Observable<AppUser | null>;

  /**
   * Autentica um usuário com e-mail e senha
   */
  signInWithEmailAndPassword(email: string, password: string): Promise<void>;

  /**
   * Cria uma nova conta de usuário
   */
  createUserWithEmailAndPassword(email: string, password: string, displayName: string): Promise<void>;

  /**
   * Encerra a sessão do usuário atual
   */
  signOut(): Promise<void>;

  /**
   * Envia e-mail de recuperação de senha
   */
  sendPasswordResetEmail(email: string): Promise<void>;

  /**
   * Autentica com provedor social (Google, Facebook, etc.)
   */
  signInWithSocialProvider(provider: 'google' | 'facebook' | 'apple'): Promise<void>;

  /**
   * Recarrega os dados do usuário atual
   */
  reloadUser(): Promise<void>;

  /**
   * Atualiza o perfil do usuário
   */
  updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void>;
}
