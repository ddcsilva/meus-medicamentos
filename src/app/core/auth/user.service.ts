import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { User, CreateUserData, UserStatus } from './user.model';

/**
 * Service para gerenciar dados do usuário no Firestore
 * Separado do AuthService para manter responsabilidades únicas
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  /**
   * Obtém dados do usuário do Firestore em tempo real
   */
  getUserData$(uid: string): Observable<User | undefined> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return docData(userRef, { idField: 'uid' }) as Observable<User | undefined>;
  }

  /**
   * Cria documento do usuário no Firestore após registro
   * Status inicial sempre 'pending' para aprovação do admin
   */
  async createUserDocument(data: CreateUserData): Promise<void> {
    this._isLoading.set(true);
    try {
      const userRef = doc(this.firestore, `users/${data.uid}`);
      const userData: Omit<User, 'uid'> = {
        email: data.email,
        nome: data.nome,
        status: 'pending',
        familyId: null,
        photoURL: data.photoURL,
        createdAt: serverTimestamp() as Timestamp,
      };

      await setDoc(userRef, userData);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Atualiza status do usuário (usado pelo Admin)
   */
  async updateUserStatus(uid: string, status: UserStatus): Promise<void> {
    this._isLoading.set(true);
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Atualiza familyId do usuário
   */
  async updateUserFamily(uid: string, familyId: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, {
        familyId,
        updatedAt: serverTimestamp(),
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Atualiza dados do perfil do usuário
   */
  async updateUserProfile(
    uid: string,
    updates: { nome?: string; photoURL?: string }
  ): Promise<void> {
    this._isLoading.set(true);
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Remove usuário de uma família
   */
  async removeUserFromFamily(uid: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, {
        familyId: null,
        updatedAt: serverTimestamp(),
      });
    } finally {
      this._isLoading.set(false);
    }
  }
}
