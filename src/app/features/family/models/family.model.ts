import { Timestamp } from '@angular/fire/firestore';

/**
 * Modelo de Família
 */
export interface Family {
  id: string;
  familyName: string;
  createdBy: string;
  members: string[];
  inviteCode: string;
  createdAt: Timestamp;
  memberRoles: Record<string, FamilyRole>;
}

/**
 * Roles dos membros da família
 */
export type FamilyRole = 'admin' | 'editor' | 'viewer';

/**
 * Dados para criação de nova família
 */
export interface CreateFamilyData {
  familyName: string;
  createdBy: string;
}

/**
 * Dados para entrar em uma família
 */
export interface JoinFamilyData {
  inviteCode: string;
  userId: string;
}
