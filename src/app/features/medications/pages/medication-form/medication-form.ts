import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { MedicationService } from '../../services/medication.service';
import { Medication, MedicationType, MedicationCategory } from '../../models/medication.model';

/**
 * Formulário de medicamento (criar/editar)
 */
@Component({
  selector: 'app-medication-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './medication-form.html',
  styleUrls: ['./medication-form.css'],
})
export class MedicationFormComponent implements OnInit {
  private authService = inject(AuthService);
  private medicationService = inject(MedicationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  medicationId = signal<string | null>(null);
  isEditMode = computed(() => !!this.medicationId());
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  private medicationId$ = toObservable(this.medicationId);
  private medication = toSignal(
    this.medicationId$.pipe(
      switchMap((id) => (id ? this.medicationService.getMedicationById$(id) : of(undefined)))
    ),
    { initialValue: undefined }
  );

  // Validador definido ANTES do form para evitar erro de inicialização
  private quantidadesValidator = (control: AbstractControl): ValidationErrors | null => {
    const totalCtrl = control.get('quantidadeTotal');
    const atualCtrl = control.get('quantidadeAtual');

    const total = totalCtrl?.value;
    const atual = atualCtrl?.value;

    if (total == null || atual == null) return null;

    // Define/limpa o erro no control de quantidadeAtual
    if (Number(atual) > Number(total)) {
      if (!atualCtrl?.hasError('exceedsTotal')) {
        atualCtrl?.setErrors({ ...(atualCtrl?.errors ?? {}), exceedsTotal: true });
      }
      return { exceedsTotal: true };
    }

    // remove apenas o exceedsTotal (sem apagar outros erros)
    if (atualCtrl?.hasError('exceedsTotal')) {
      const nextErrors = { ...(atualCtrl.errors ?? {}) };
      delete nextErrors['exceedsTotal'];
      atualCtrl.setErrors(Object.keys(nextErrors).length ? nextErrors : null);
    }

    return null;
  };

  medicationForm: FormGroup = this.fb.group(
    {
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      droga: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      generico: [false, Validators.required],
      tipo: ['comprimido', Validators.required],
      marca: ['', Validators.maxLength(100)],
      dosagem: ['', Validators.maxLength(50)],
      lote: ['', Validators.maxLength(50)],
      categoria: [''],
      validade: ['', Validators.required],
      quantidadeTotal: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
      quantidadeAtual: [1, [Validators.required, Validators.min(0)]],
      observacoes: ['', Validators.maxLength(500)],
    },
    { validators: [this.quantidadesValidator] }
  );

  tipos: MedicationType[] = ['comprimido', 'capsula', 'liquido', 'pomada', 'injecao', 'outro'];
  categorias: MedicationCategory[] = [
    'analgesico',
    'antibiotico',
    'anti-inflamatorio',
    'antihipertensivo',
    'antidiabético',
    'antihistaminico',
    'vitamina',
    'outro',
  ];

  ngOnInit(): void {
    // Verifica se é modo edição
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.medicationId.set(id);
    }

    // Popula o form quando o medication carregar
    effect(() => {
      const medication = this.medication();
      if (!medication) return;
      this.patchFormFromMedication(medication);
    });

  }

  private patchFormFromMedication(medication: Medication): void {
    // Converte Timestamp para string no formato YYYY-MM-DD
    const validadeDate = medication.validade.toDate();
    const validadeStr = validadeDate.toISOString().split('T')[0];

    this.medicationForm.patchValue({
      nome: medication.nome,
      droga: medication.droga,
      generico: medication.generico,
      tipo: medication.tipo,
      marca: medication.marca,
      dosagem: medication.dosagem,
      lote: medication.lote,
      categoria: medication.categoria,
      validade: validadeStr,
      quantidadeTotal: medication.quantidadeTotal,
      quantidadeAtual: medication.quantidadeAtual,
      observacoes: medication.observacoes,
    });
  }

  async handleSubmit(): Promise<void> {
    if (this.medicationForm.invalid) {
      this.medicationForm.markAllAsTouched();
      return;
    }

    const userData = this.authService.userData();
    if (!userData || !userData.familyId) {
      this.errorMessage.set('Usuário sem família associada');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.medicationForm.value;
      const validadeDate = new Date(formValue.validade);

      if (this.isEditMode()) {
        // Atualizar
        await this.medicationService.updateMedication(this.medicationId()!, {
          nome: formValue.nome,
          droga: formValue.droga,
          generico: formValue.generico,
          tipo: formValue.tipo,
          marca: formValue.marca || undefined,
          dosagem: formValue.dosagem || undefined,
          lote: formValue.lote || undefined,
          categoria: formValue.categoria || undefined,
          validade: validadeDate,
          quantidadeTotal: formValue.quantidadeTotal,
          quantidadeAtual: formValue.quantidadeAtual,
          observacoes: formValue.observacoes || undefined,
        });
      } else {
        // Criar
        await this.medicationService.createMedication({
          familyId: userData.familyId,
          nome: formValue.nome,
          droga: formValue.droga,
          generico: formValue.generico,
          tipo: formValue.tipo,
          marca: formValue.marca || undefined,
          dosagem: formValue.dosagem || undefined,
          lote: formValue.lote || undefined,
          categoria: formValue.categoria || undefined,
          validade: validadeDate,
          quantidadeTotal: formValue.quantidadeTotal,
          quantidadeAtual: formValue.quantidadeAtual,
          observacoes: formValue.observacoes || undefined,
          criadoPor: userData.uid,
        });
      }

      // Redireciona para lista
      this.router.navigate(['/app/medications']);
    } catch (error: any) {
      console.error('Erro ao salvar medicamento:', error);
      this.errorMessage.set(error.message || 'Erro ao salvar medicamento');
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/app/medications']);
  }

  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Helpers para validação
  isFieldInvalid(fieldName: string): boolean {
    const field = this.medicationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.medicationForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
    if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    if (field.errors['exceedsTotal']) return 'Quantidade atual não pode ser maior que a total';

    return 'Campo inválido';
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

  formatCategoriaLabel(categoria: string): string {
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
}
