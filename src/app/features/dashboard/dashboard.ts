import { Component, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { MedicationService } from '../medications/services/medication.service';
import { Medication, MedicationStatus } from '../medications/models/medication.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private authService = inject(AuthService);
  private medicationService = inject(MedicationService);
  private router = inject(Router);

  familyId = computed(() => this.authService.userData()?.familyId);

  // Medicamentos da família em tempo real (sem subscribe manual)
  private familyId$ = toObservable(this.familyId);
  allMedications = toSignal(
    this.familyId$.pipe(
      switchMap((famId) => (famId ? this.medicationService.getMedicationsByFamily$(famId) : of([])))
    ),
    { initialValue: [] as Medication[] }
  );

  // Estatísticas
  stats = computed(() => {
    const meds = this.allMedications();
    return this.medicationService.calculateStats(meds);
  });

  // Medicamentos vencidos (alertas urgentes)
  expiredMedications = computed(() => {
    const meds = this.allMedications();
    return meds
      .filter((med) => this.medicationService.calculateStatus(med.validade) === 'VENCIDO')
      .slice(0, 5); // Máximo 5
  });

  // Medicamentos vencendo em breve (próximos 30 dias)
  expiringSoonMedications = computed(() => {
    const meds = this.allMedications();
    return meds
      .filter((med) => this.medicationService.calculateStatus(med.validade) === 'PRESTES_VENCER')
      .sort((a, b) => a.validade.toMillis() - b.validade.toMillis())
      .slice(0, 6); // Máximo 6
  });

  // Medicamentos com estoque baixo
  lowStockMedications = computed(() => {
    const meds = this.allMedications();
    return meds
      .filter((med) => this.medicationService.isLowStock(med.quantidadeAtual, med.quantidadeTotal))
      .slice(0, 5);
  });

  getFirstName(): string {
    const fullName = this.authService.userData()?.nome || 
                     this.authService.currentUser()?.displayName || '';
    return fullName.split(' ')[0] || 'Visitante';
  }

  getStatusClass(medication: Medication): string {
    const status = this.medicationService.calculateStatus(medication.validade);
    const classes: Record<MedicationStatus, string> = {
      VALIDO: 'bg-green-100 text-green-800',
      PRESTES_VENCER: 'bg-yellow-100 text-yellow-800',
      VENCIDO: 'bg-red-100 text-red-800',
    };
    return classes[status];
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

  navigateToMedications(): void {
    this.router.navigate(['/app/medications']);
  }

  navigateToNewMedication(): void {
    this.router.navigate(['/app/medications/new']);
  }

  navigateToMedicationDetail(id: string): void {
    this.router.navigate(['/app/medications', id]);
  }
}
