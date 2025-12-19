import { Timestamp } from '@angular/fire/firestore';

/**
 * Tipo de medicamento
 */
export type MedicationType =
  | 'comprimido'
  | 'capsula'
  | 'liquido'
  | 'pomada'
  | 'injecao'
  | 'outro';

/**
 * Categoria de medicamento
 */
export type MedicationCategory =
  | 'analgesico'
  | 'antibiotico'
  | 'anti-inflamatorio'
  | 'antihipertensivo'
  | 'antidiabético'
  | 'antihistaminico'
  | 'vitamina'
  | 'outro';

/**
 * Status de validade (calculado automaticamente)
 */
export type MedicationStatus = 'VALIDO' | 'PRESTES_VENCER' | 'VENCIDO';

/**
 * Modelo de Medicamento
 */
export interface Medication {
  id: string;
  familyId: string; // Pertence à família, não ao usuário

  // Dados básicos
  nome: string;
  droga: string;
  generico: boolean;
  tipo: MedicationType;

  // Opcionais
  marca?: string;
  dosagem?: string;
  lote?: string;
  categoria?: MedicationCategory;

  // Validade e quantidade
  validade: Timestamp;
  quantidadeTotal: number;
  quantidadeAtual: number;

  // Mídia e observações
  fotoUrl?: string;
  observacoes?: string;

  // Auditoria
  criadoPor: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

/**
 * Dados para criação de medicamento
 */
export interface CreateMedicationData {
  familyId: string;
  nome: string;
  droga: string;
  generico: boolean;
  tipo: MedicationType;
  marca?: string;
  dosagem?: string;
  lote?: string;
  categoria?: MedicationCategory;
  validade: Date;
  quantidadeTotal: number;
  quantidadeAtual: number;
  fotoUrl?: string;
  observacoes?: string;
  criadoPor: string;
}

/**
 * Dados para atualização de medicamento
 */
export interface UpdateMedicationData {
  nome?: string;
  droga?: string;
  generico?: boolean;
  tipo?: MedicationType;
  marca?: string;
  dosagem?: string;
  lote?: string;
  categoria?: MedicationCategory;
  validade?: Date;
  quantidadeTotal?: number;
  quantidadeAtual?: number;
  fotoUrl?: string;
  observacoes?: string;
}

/**
 * Filtros para busca de medicamentos
 */
export interface MedicationFilters {
  searchTerm?: string;
  status?: MedicationStatus;
  tipo?: MedicationType;
  categoria?: MedicationCategory;
  generico?: boolean;
}

/**
 * Estatísticas de medicamentos
 */
export interface MedicationStats {
  total: number;
  expiringSoon: number; // <= 30 dias
  expired: number;
  lowStock: number; // < 20% do total
}
