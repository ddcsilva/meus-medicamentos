import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { MedicationService } from '../../services/medication.service';
import { Medication, MedicationStatus } from '../../models/medication.model';

/**
 * Página de lista de medicamentos
 * Exibe todos os medicamentos da família com busca e filtros
 */
@Component({
  selector: 'app-medication-list',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './medication-list.html',
  styleUrls: ['./medication-list.css'],
})
export class MedicationListComponent {
  private authService = inject(AuthService);
  private medicationService = inject(MedicationService);
  private router = inject(Router);

  familyId = computed(() => this.authService.userData()?.familyId);

  private familyId$ = toObservable(this.familyId);
  allMedications = toSignal(
    this.familyId$.pipe(
      switchMap((famId) => (famId ? this.medicationService.getMedicationsByFamily$(famId) : of([])))
    ),
    { initialValue: [] as Medication[] }
  );

  // Filtros
  searchTerm = signal('');
  selectedStatus = signal<MedicationStatus | 'ALL'>('ALL');

  // Medicamentos filtrados
  filteredMedications = computed(() => {
    const meds = this.allMedications();
    const search = this.searchTerm();
    const status = this.selectedStatus();

    let filtered = meds;

    // Busca por texto
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.nome.toLowerCase().includes(term) ||
          med.droga.toLowerCase().includes(term) ||
          med.marca?.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (status !== 'ALL') {
      filtered = filtered.filter(
        (med) => this.medicationService.calculateStatus(med.validade) === status
      );
    }

    return filtered;
  });

  // Estatísticas
  stats = computed(() => {
    const meds = this.allMedications();
    return this.medicationService.calculateStats(meds);
  });

  isLoading = this.medicationService.isLoading;

  getStatusClass(medication: Medication): string {
    const status = this.medicationService.calculateStatus(medication.validade);
    const classes: Record<MedicationStatus, string> = {
      VALIDO: 'bg-green-100 text-green-800',
      PRESTES_VENCER: 'bg-yellow-100 text-yellow-800',
      VENCIDO: 'bg-red-100 text-red-800',
    };
    return classes[status];
  }

  getStatusLabel(medication: Medication): string {
    const status = this.medicationService.calculateStatus(medication.validade);
    const labels: Record<MedicationStatus, string> = {
      VALIDO: 'Válido',
      PRESTES_VENCER: 'Vencendo',
      VENCIDO: 'Vencido',
    };
    return labels[status];
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  navigateToNew(): void {
    this.router.navigate(['/app/medications/new']);
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/app/medications', id]);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value as MedicationStatus | 'ALL');
  }

  getStockPercentage(medication: Medication): number {
    if (medication.quantidadeTotal === 0) return 0;
    return (medication.quantidadeAtual / medication.quantidadeTotal) * 100;
  }

  getStockClass(medication: Medication): string {
    const percentage = this.getStockPercentage(medication);
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  }
}
