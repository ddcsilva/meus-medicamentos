import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  collectionData,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { User } from '../../../core/auth/user.model';

/**
 * Service para operações administrativas
 */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);

  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  /**
   * Obtém usuários pendentes de aprovação
   */
  getPendingUsers$(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('status', '==', 'pending'));
    return collectionData(q, { idField: 'uid' }) as Observable<User[]>;
  }

  /**
   * Obtém todos os usuários
   */
  getAllUsers$(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'uid' }) as Observable<User[]>;
  }

  /**
   * Aprova um usuário (via Cloud Function)
   */
  async approveUser(uid: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const approveUserFn = httpsCallable(this.functions, 'approveUser');
      await approveUserFn({ uid, approve: true });
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Rejeita um usuário (via Cloud Function)
   */
  async rejectUser(uid: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const approveUserFn = httpsCallable(this.functions, 'approveUser');
      await approveUserFn({ uid, approve: false });
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Define um usuário como admin (via Cloud Function)
   * ATENÇÃO: Esta função deve ser protegida e usada apenas para setup inicial
   */
  async setAdmin(email: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const setAdminFn = httpsCallable(this.functions, 'setAdmin');
      await setAdminFn({ email });
    } catch (error) {
      console.error('Erro ao definir admin:', error);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Obtém estatísticas de usuários
   */
  async getUserStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const usersRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersRef);

    const stats = {
      total: snapshot.size,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    snapshot.forEach((doc) => {
      const user = doc.data() as User;
      if (user.status === 'pending') stats.pending++;
      else if (user.status === 'approved') stats.approved++;
      else if (user.status === 'rejected') stats.rejected++;
    });

    return stats;
  }
}
