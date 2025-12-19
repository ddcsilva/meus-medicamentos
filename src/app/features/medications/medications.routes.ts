import { Routes } from '@angular/router';

/**
 * Rotas da feature de medicamentos
 */
export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/medication-list/medication-list').then((m) => m.MedicationListComponent),
    title: 'MedStock - Medicamentos',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/medication-form/medication-form').then((m) => m.MedicationFormComponent),
    title: 'MedStock - Novo Medicamento',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/medication-detail/medication-detail').then(
        (m) => m.MedicationDetailComponent
      ),
    title: 'MedStock - Detalhes do Medicamento',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/medication-form/medication-form').then((m) => m.MedicationFormComponent),
    title: 'MedStock - Editar Medicamento',
  },
] as Routes;
