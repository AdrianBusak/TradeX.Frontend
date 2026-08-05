import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ToastService } from '../../../core/services/toast.service';
import { DialogLayoutComponent } from '../../../shared/components/layout/dialog-layout/dialog-layout.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/components/app-select/app-select.component';
import { TradingInstrumentService } from '../services/trading-instrument.service';
import { MARKET_TYPES } from '../../strategies/models/strategy.model';
import { MarketType } from '../../strategies/models/strategy.model';

@Component({
  selector: 'app-trading-instrument-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DialogLayoutComponent,
    AppInputComponent,
    AppSelectComponent,
  ],
  templateUrl: './trading-instrument-dialog.component.html',
  styleUrl: './trading-instrument-dialog.component.scss',
})
export class TradingInstrumentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TradingInstrumentService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<TradingInstrumentDialogComponent>);

  readonly isSaving = signal(false);
  submitted = false;

  readonly marketTypeOptions: AppSelectOption[] = MARKET_TYPES.map(m => ({
    label: this.translate.instant(`STRATEGIES.MARKET_TYPES.${m.toUpperCase()}`),
    value: m,
  }));

  readonly form = this.fb.group({
    symbol: ['', [Validators.required, Validators.maxLength(20)]],
    marketType: [null as MarketType | null, Validators.required],
  });

  constructor() {
    this.form.get('symbol')?.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.form.get('symbol')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  fieldError(fieldName: string): string {
    const ctrl = this.form.get(fieldName);
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.hasError('required')) return this.translate.instant('ERRORS.REQUIRED');
    if (ctrl.hasError('maxlength')) {
      const max = (ctrl.getError('maxlength') as { requiredLength: number }).requiredLength;
      return this.translate.instant('ERRORS.MAX_LENGTH', { max });
    }
    return '';
  }

  onConfirm(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    this.isSaving.set(true);

    this.service.create({
      symbol: value.symbol!.trim().toUpperCase(),
      marketType: value.marketType!,
    }).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (res) => {
        this.toastService.success('TRADING_INSTRUMENTS.CREATE_SUCCESS');
        this.dialogRef.close(res.id);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
