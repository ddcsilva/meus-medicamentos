import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { MedicationService } from '../../services/medication.service';
import { Medication, MedicationStatus } from '../../models/medication.model';

/**
 * Página de detalhes do medicamento
 */
@Component({
  selector: 'app-medication-detail',
  standalone: true,
  imports: [RouterModule, DecimalPipe],
  templateUrl: './medication-detail.html',
  styleUrls: ['./medication-detail.css'],
})
export class MedicationDetailComponent implements OnInit {
  private medicationService = inject(MedicationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  medicationId = signal<string | null>(null);
  showDeleteConfirm = signal(false);
  isDeleting = signal(false);
  private medicationId$ = toObservable(this.medicationId);
  medication = toSignal(
    this.medicationId$.pipe(
      switchMap((id) => (id ? this.medicationService.getMedicationById$(id) : of(undefined)))
    ),
    { initialValue: undefined }
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.medicationId.set(id);
    }
  }

  getStatus(): MedicationStatus | null {
    const med = this.medication();
    if (!med) return null;
    return this.medicationService.calculateStatus(med.validade);
  }

  getStatusClass(): string {
    const status = this.getStatus();
    if (!status) return '';

    const classes: Record<MedicationStatus, string> = {
      VALIDO: 'bg-green-100 text-green-800 border-green-200',
      PRESTES_VENCER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      VENCIDO: 'bg-red-100 text-red-800 border-red-200',
    };
    return classes[status];
  }

  getStatusLabel(): string {
    const status = this.getStatus();
    if (!status) return '';

    const labels: Record<MedicationStatus, string> = {
      VALIDO: 'Válido',
      PRESTES_VENCER: 'Vencendo em Breve',
      VENCIDO: 'Vencido',
    };
    return labels[status];
  }

  getStatusIcon(): string {
    const status = this.getStatus();
    if (!status) return '';

    if (status === 'VALIDO') {
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    } else if (status === 'PRESTES_VENCER') {
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
    } else {
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  formatTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      comprimido: 'Comprimido',
      capsula: 'Cápsula',
      liquido: 'Líquido',
      pomada: 'Pomada',
      injecao: 'Injeção',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  }

  formatCategoriaLabel(categoria?: string): string {
    if (!categoria) return '-';
    const labels: Record<string, string> = {
      analgesico: 'Analgésico',
      antibiotico: 'Antibiótico',
      'anti-inflamatorio': 'Anti-inflamatório',
      antihipertensivo: 'Anti-hipertensivo',
      'antidiabético': 'Antidiabético',
      antihistaminico: 'Anti-histamínico',
      vitamina: 'Vitamina',
      outro: 'Outro',
    };
    return labels[categoria] || categoria;
  }

  getStockPercentage(): number {
    const med = this.medication();
    if (!med || med.quantidadeTotal === 0) return 0;
    return (med.quantidadeAtual / med.quantidadeTotal) * 100;
  }

  getStockClass(): string {
    const percentage = this.getStockPercentage();
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  isLowStock(): boolean {
    const med = this.medication();
    if (!med) return false;
    return this.medicationService.isLowStock(med.quantidadeAtual, med.quantidadeTotal);
  }

  navigateToEdit(): void {
    this.router.navigate(['/app/medications', this.medicationId(), 'edit']);
  }

  navigateToList(): void {
    this.router.navigate(['/app/medications']);
  }

  openDeleteConfirm(): void {
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  async handleDelete(): Promise<void> {
    this.isDeleting.set(true);
    try {
      const id = this.medicationId();
      if (!id) return;
      await this.medicationService.deleteMedication(id);
      this.router.navigate(['/app/medications']);
    } catch (error) {
      console.error('Erro ao deletar medicamento:', error);
      alert('Erro ao deletar medicamento');
    } finally {
      this.isDeleting.set(false);
      this.closeDeleteConfirm();
    }
  }
}
