import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  arrayUnion,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Family, CreateFamilyData, JoinFamilyData } from '../models/family.model';
import { UserService } from '../../../core/auth/user.service';

/**
 * Service para gerenciar famílias
 */
@Injectable({
  providedIn: 'root',
})
export class FamilyService {
  private firestore = inject(Firestore);
  private userService = inject(UserService);
  private functions = inject(Functions);

  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  /**
   * Gera código de convite único (formato: FAM-XXXXXX)
   */
  private generateInviteCode(): string {
    // Caracteres sem confusão visual: A-Z excluindo (I, O), 2-9
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'FAM-';

    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  /**
   * Cria nova família
   */
  async createFamily(data: CreateFamilyData): Promise<Family> {
    this._isLoading.set(true);
    try {
      const inviteCode = this.generateInviteCode();

      const familyData = {
        familyName: data.familyName,
        createdBy: data.createdBy,
        members: [data.createdBy],
        inviteCode,
        createdAt: serverTimestamp() as Timestamp,
        memberRoles: {
          [data.createdBy]: 'admin',
        },
      };

      const familyRef = await addDoc(collection(this.firestore, 'families'), familyData);

      // Atualiza o familyId do usuário
      await this.userService.updateUserFamily(data.createdBy, familyRef.id);

      return {
        id: familyRef.id,
        ...familyData,
        createdAt: Timestamp.now(),
      } as Family;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Busca família pelo código de convite
   */
  async findFamilyByInviteCode(inviteCode: string): Promise<Family | null> {
    this._isLoading.set(true);
    try {
      const familiesRef = collection(this.firestore, 'families');
      const q = query(familiesRef, where('inviteCode', '==', inviteCode.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Family;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Entrar em uma família existente usando código de convite
   */
  async joinFamily(data: JoinFamilyData): Promise<Family> {
    this._isLoading.set(true);
    try {
      // Entrada segura via Cloud Function (evita bypass por rules)
      const joinFn = httpsCallable<{ inviteCode: string }, { success: boolean; familyId: string }>(
        this.functions,
        'joinFamilyByInviteCode'
      );

      const result = await joinFn({ inviteCode: data.inviteCode });
      const familyId = result.data.familyId;

      const updated = await this.getFamilyById(familyId);
      if (!updated) {
        throw new Error('Família não encontrada após entrada');
      }
      return updated;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Obtém dados de uma família
   */
  async getFamilyById(familyId: string): Promise<Family | null> {
    this._isLoading.set(true);
    try {
      const familyRef = doc(this.firestore, `families/${familyId}`);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        return null;
      }

      return {
        id: familyDoc.id,
        ...familyDoc.data(),
      } as Family;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Remove membro da família
   */
  async removeMember(familyId: string, userId: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const familyRef = doc(this.firestore, `families/${familyId}`);
      const familyDoc = await getDoc(familyRef);

      if (!familyDoc.exists()) {
        throw new Error('Família não encontrada');
      }

      const family = familyDoc.data() as Family;
      const updatedMembers = family.members.filter((id) => id !== userId);

      // Remove do array de membros e do objeto de roles
      const updatedRoles = { ...family.memberRoles };
      delete updatedRoles[userId];

      await updateDoc(familyRef, {
        members: updatedMembers,
        memberRoles: updatedRoles,
      });

      // Remove familyId do usuário
      await this.userService.removeUserFromFamily(userId);
    } finally {
      this._isLoading.set(false);
    }
  }
}
