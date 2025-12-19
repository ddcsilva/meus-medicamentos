import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  collectionData,
  docData,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import {
  Medication,
  CreateMedicationData,
  UpdateMedicationData,
  MedicationStatus,
} from '../models/medication.model';

/**
 * Service para gerenciar medicamentos
 */
@Injectable({
  providedIn: 'root',
})
export class MedicationService {
  private firestore = inject(Firestore);
  private _isLoading = signal(false);
  public readonly isLoading = this._isLoading.asReadonly();

  /**
   * Obtém medicamentos da família em tempo real
   */
  getMedicationsByFamily$(familyId: string): Observable<Medication[]> {
    const medicationsRef = collection(this.firestore, 'medications');
    const q = query(
      medicationsRef,
      where('familyId', '==', familyId),
      orderBy('validade', 'asc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Medication[]>;
  }

  /**
   * Obtém um medicamento específico
   */
  getMedicationById$(id: string): Observable<Medication | undefined> {
    const medicationRef = doc(this.firestore, `medications/${id}`);
    return docData(medicationRef, { idField: 'id' }) as Observable<Medication | undefined>;
  }

  /**
   * Cria novo medicamento
   */
  async createMedication(data: CreateMedicationData): Promise<string> {
    this._isLoading.set(true);
    try {
      const medicationData = {
        ...data,
        validade: Timestamp.fromDate(data.validade),
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      };

      const docRef = await addDoc(collection(this.firestore, 'medications'), medicationData);
      return docRef.id;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Atualiza medicamento
   */
  async updateMedication(id: string, data: UpdateMedicationData): Promise<void> {
    this._isLoading.set(true);
    try {
      const medicationRef = doc(this.firestore, `medications/${id}`);
      const updateData: any = {
        ...data,
        atualizadoEm: serverTimestamp(),
      };

      // Converte data se presente
      if (data.validade) {
        updateData.validade = Timestamp.fromDate(data.validade);
      }

      await updateDoc(medicationRef, updateData);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Deleta medicamento
   */
  async deleteMedication(id: string): Promise<void> {
    this._isLoading.set(true);
    try {
      const medicationRef = doc(this.firestore, `medications/${id}`);
      await deleteDoc(medicationRef);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Calcula status de validade baseado na data
   */
  calculateStatus(validade: Timestamp | Date): MedicationStatus {
    const validadeDate = validade instanceof Timestamp ? validade.toDate() : validade;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diasParaVencer = Math.floor(
      (validadeDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasParaVencer < 0) {
      return 'VENCIDO';
    } else if (diasParaVencer <= 30) {
      return 'PRESTES_VENCER';
    } else {
      return 'VALIDO';
    }
  }

  /**
   * Verifica se o estoque está baixo (< 20% do total)
   */
  isLowStock(quantidadeAtual: number, quantidadeTotal: number): boolean {
    if (quantidadeTotal === 0) return false;
    return quantidadeAtual < quantidadeTotal * 0.2;
  }

  /**
   * Atualiza quantidade atual do medicamento
   */
  async updateQuantidade(id: string, novaQuantidade: number): Promise<void> {
    this._isLoading.set(true);
    try {
      const medicationRef = doc(this.firestore, `medications/${id}`);
      await updateDoc(medicationRef, {
        quantidadeAtual: novaQuantidade,
        atualizadoEm: serverTimestamp(),
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Filtra medicamentos baseado em critérios
   */
  filterMedications(
    medications: Medication[],
    searchTerm?: string,
    status?: MedicationStatus
  ): Medication[] {
    let filtered = [...medications];

    // Filtro de busca por texto
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.nome.toLowerCase().includes(term) ||
          med.droga.toLowerCase().includes(term) ||
          med.marca?.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (status) {
      filtered = filtered.filter((med) => this.calculateStatus(med.validade) === status);
    }

    return filtered;
  }

  /**
   * Calcula estatísticas dos medicamentos
   */
  calculateStats(medications: Medication[]): {
    total: number;
    expiringSoon: number;
    expired: number;
    lowStock: number;
  } {
    return {
      total: medications.length,
      expiringSoon: medications.filter(
        (med) => this.calculateStatus(med.validade) === 'PRESTES_VENCER'
      ).length,
      expired: medications.filter((med) => this.calculateStatus(med.validade) === 'VENCIDO')
        .length,
      lowStock: medications.filter((med) => this.isLowStock(med.quantidadeAtual, med.quantidadeTotal))
        .length,
    };
  }
}
