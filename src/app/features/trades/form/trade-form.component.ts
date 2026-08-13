import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, concatMap, finalize, from, map, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

import { ToastService } from '../../../core/services/toast.service';
import { QueryBuilder } from '../../../core/utils/query-builder';
import { AddEditPageLayoutComponent } from '../../../shared/components/layout/add-edit-page-layout/add-edit-page-layout.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/components/app-select/app-select.component';
import { AppTextareaComponent } from '../../../shared/components/app-textarea/app-textarea.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { DateFieldComponent } from '../../../shared/components/form-fields/date-field/date-field.component';
import { TradeService } from '../services/trade.service';
import { TradingInstrumentService } from '../services/trading-instrument.service';
import { StrategyService } from '../../strategies/services/strategy.service';
import { TradingAccountService } from '../../trading-accounts/services/trading-account.service';
import {
  CreateTradeRequest,
  TRADE_DIRECTIONS,
  TRADE_STATUSES,
  TRADING_SESSIONS,
  TradeDetails,
  TradeDirection,
  TradeStatus,
  TradingSession,
  UpdateTradeRequest,
  TradeImage,
} from '../models/trade.model';
import {
  TradingInstrumentDialogComponent,
} from '../instrument-dialog/trading-instrument-dialog.component';
import { LotCalculatorDialogComponent, LotCalculatorDialogData } from '../lot-calculator-dialog/lot-calculator-dialog.component';
import { CalculateLotResponse } from '../models/lot-calculator.model';
import { TradeRuleCheckItem, TradeRuleChecksResponse, UpdateTradeRuleChecksRequest } from '../models/trade-rule-check.model';
import { TradeRuleCheckService } from '../services/trade-rule-check.service';
import { TradeMistakesSectionComponent } from '../mistakes/trade-mistakes-section.component';

type TradeImageUploadStatus = 'PENDING' | 'UPLOADING' | 'ERROR';

interface TradeImageUploadItem {
  id: string;
  fileName: string;
  uploadStatus: TradeImageUploadStatus;
  file: File;
  error?: string;
}

@Component({
  selector: 'app-trade-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AddEditPageLayoutComponent,
    AppInputComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppButtonComponent,
    DateFieldComponent,
    MatIcon,
    TradeMistakesSectionComponent,
  ],
  templateUrl: './trade-form.component.html',
  styleUrl: './trade-form.component.scss',
})
export class TradeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tradeService = inject(TradeService);
  private readonly instrumentService = inject(TradingInstrumentService);
  private readonly strategyService = inject(StrategyService);
  private readonly accountService = inject(TradingAccountService);
  private readonly tradeRuleCheckService = inject(TradeRuleCheckService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  isEditMode = false;
  tradeId: string | null = null;
  submitted = false;

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly strategyOptions = signal<AppSelectOption[]>([]);
  readonly instrumentOptions = signal<AppSelectOption[]>([]);
  readonly accountOptions = signal<{ id: string; label: string }[]>([]);
  readonly rMultiplePreview = signal('—');
  readonly priceWarningKey = signal('');
  readonly images = signal<TradeImage[]>([]);
  readonly isLoadingImages = signal(false);
  readonly uploadItems = signal<TradeImageUploadItem[]>([]);
  readonly isDragOverImages = signal(false);
  readonly isUploadingImages = computed(() => this.uploadItems().some(item => item.uploadStatus === 'UPLOADING'));
  readonly hasFailedImageUploads = computed(() => this.uploadItems().some(item => item.uploadStatus === 'ERROR'));
  readonly deletingImageId = signal<string | null>(null);
  readonly imageErrors = signal<string[]>([]);
  readonly ruleChecks = signal<TradeRuleChecksResponse | null>(null);
  readonly isLoadingRuleChecks = signal(false);
  readonly isSavingRuleChecks = signal(false);
  readonly ruleChecksLoadFailed = signal(false);
  readonly hasTradeStrategy = signal(false);
  readonly saveStatus = signal<'CREATING' | 'UPLOADING' | null>(null);
  readonly createUploadProgress = signal({ completed: 0, total: 0 });
  readonly createdTradeId = signal<string | null>(null);
  readonly imageFileInput = viewChild.required<ElementRef<HTMLInputElement>>('imageFileInput');

  readonly lightboxIndex = signal<number | null>(null);
  readonly isLightboxOpen = computed(() => this.lightboxIndex() !== null);
  readonly lightboxImage = computed<TradeImage | null>(() => {
    const index = this.lightboxIndex();
    const list = this.images();
    if (index === null || index < 0 || index >= list.length) return null;
    return list[index];
  });

  readonly directionOptions: AppSelectOption[] = TRADE_DIRECTIONS.map(d => ({
    label: this.translate.instant(`TRADES.DIRECTIONS.${d.toUpperCase()}`),
    value: d,
  }));

  readonly statusOptions: AppSelectOption[] = TRADE_STATUSES.map(s => ({
    label: this.translate.instant(`TRADES.STATUSES.${this.enumKey(s)}`),
    value: s,
  }));

  readonly sessionOptions: AppSelectOption[] = TRADING_SESSIONS.map(s => ({
    label: this.translate.instant(`TRADES.SESSIONS.${this.enumKey(s)}`),
    value: s,
  }));

  readonly form = this.fb.group({
    tradingInstrumentId: [null as string | null, Validators.required],
    strategyId: [null as string | null, Validators.required],
    tradingAccountIds: [[] as string[], Validators.required],
    direction: [null as TradeDirection | null, Validators.required],
    session: [null as TradingSession | null],
    status: ['Planned' as TradeStatus, Validators.required],
    tradeDate: [null as string | null, Validators.required],
    entryPrice: [null as number | null, Validators.min(Number.EPSILON)],
    exitPrice: [null as number | null, Validators.min(Number.EPSILON)],
    stopLoss: [null as number | null, Validators.min(Number.EPSILON)],
    takeProfit: [null as number | null, Validators.min(Number.EPSILON)],
    lotSize: [null as number | null, Validators.min(Number.EPSILON)],
    riskAmount: [null as number | null, Validators.min(0)],
    pnl: [null as number | null],
    notes: [null as string | null, Validators.maxLength(4000)],
  });

  constructor() {
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.updateDerivedState());

    effect(() => {
      const index = this.lightboxIndex();
      const total = this.images().length;
      if (index === null) return;
      if (total === 0) {
        this.lightboxIndex.set(null);
      } else if (index >= total) {
        this.lightboxIndex.set(total - 1);
      }
    });

    effect(() => {
      if (typeof document === 'undefined') return;
      document.body.style.overflow = this.isLightboxOpen() ? 'hidden' : '';
    });
  }

  ngOnInit(): void {
    this.tradeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.tradeId;

    this.loadLookups();

    if (this.isEditMode) {
      this.loadTrade();
    }
  }

  isAccountSelected(accountId: string): boolean {
    return (this.form.get('tradingAccountIds')!.value as string[]).includes(accountId);
  }

  onAccountToggle(accountId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.get('tradingAccountIds')!.value as string[];
    const updated = checked
      ? [...current, accountId]
      : current.filter(id => id !== accountId);
    this.form.get('tradingAccountIds')!.setValue(updated);
    this.form.get('tradingAccountIds')!.markAsTouched();
  }

  onSave(): void {
    if (this.createdTradeId()) return;
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    if (this.isEditMode) {
      this.submitUpdate();
    } else {
      this.submitCreate();
    }
  }

  onBack(): void {
    this.router.navigate(['/trades']);
  }

  onCreateInstrument(): void {
    this.dialog.open(TradingInstrumentDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((createdId: string | null) => {
        if (createdId) this.loadInstrumentLookup(createdId);
      });
  }

  onCalculateLot(): void {
    const value = this.form.getRawValue();
    const data: LotCalculatorDialogData = {
      tradingAccountId: value.tradingAccountIds?.[0] ?? null,
      tradingInstrumentId: value.tradingInstrumentId,
      entryPrice: this.coerceNumber(value.entryPrice),
      stopLossPrice: this.coerceNumber(value.stopLoss),
    };

    this.dialog.open(LotCalculatorDialogComponent, { data, width: '720px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((response: CalculateLotResponse | null) => {
        if (!response) return;
        this.form.patchValue({
          lotSize: response.roundedLotSize,
          riskAmount: response.riskAmount,
        });
      });
  }

  loadRuleChecks(): void {
    if (!this.tradeId || !this.hasTradeStrategy()) return;

    this.isLoadingRuleChecks.set(true);
    this.ruleChecksLoadFailed.set(false);
    this.tradeRuleCheckService.getByTradeId(this.tradeId).pipe(
      finalize(() => this.isLoadingRuleChecks.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => this.ruleChecks.set(response),
      error: () => this.ruleChecksLoadFailed.set(true),
    });
  }

  setRuleFollowed(strategyRuleId: string, isFollowed: boolean | null): void {
    this.ruleChecks.update(response => response ? {
      ...response,
      rules: response.rules.map(rule => rule.strategyRuleId === strategyRuleId ? { ...rule, isFollowed } : rule),
    } : response);
  }

  setRuleNote(strategyRuleId: string, event: Event): void {
    const note = (event.target as HTMLTextAreaElement).value;
    this.ruleChecks.update(response => response ? {
      ...response,
      rules: response.rules.map(rule => rule.strategyRuleId === strategyRuleId ? { ...rule, note } : rule),
    } : response);
  }

  ruleStatus(rule: TradeRuleCheckItem): 'FOLLOWED' | 'BROKEN' | 'NOT_CHECKED' {
    if (rule.isFollowed === true) return 'FOLLOWED';
    if (rule.isFollowed === false) return 'BROKEN';
    return 'NOT_CHECKED';
  }

  saveRuleChecks(): void {
    const response = this.ruleChecks();
    if (!this.tradeId || !response || this.isSavingRuleChecks()) return;

    const request: UpdateTradeRuleChecksRequest = {
      rules: response.rules
        .filter(rule => rule.isFollowed !== null && rule.isFollowed !== undefined)
        .map(rule => ({
          strategyRuleId: rule.strategyRuleId,
          isFollowed: rule.isFollowed!,
          note: rule.note?.trim() || null,
        })),
    };

    this.isSavingRuleChecks.set(true);
    this.tradeRuleCheckService.update(this.tradeId, request).pipe(
      finalize(() => this.isSavingRuleChecks.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: updated => {
        this.ruleChecks.set(updated);
        this.toastService.success('TRADES.RULE_COMPLIANCE.SAVE_SUCCESS');
      },
    });
  }

  triggerImageFileInput(): void {
    if (!this.isUploadingImages()) this.imageFileInput().nativeElement.click();
  }

  onImagesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    (event.target as HTMLInputElement).value = '';
    this.queueImages(files);
  }

  onImagesDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isUploadingImages()) this.isDragOverImages.set(true);
  }

  onImagesDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverImages.set(false);
  }

  onImagesDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverImages.set(false);
    this.queueImages(Array.from(event.dataTransfer?.files ?? []));
  }

  private queueImages(files: File[]): void {
    if (files.length === 0 || this.isUploadingImages()) return;

    const validFiles: File[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const validationError = this.validateImage(file);
      if (validationError) errors.push(`${file.name}: ${validationError}`);
      else validFiles.push(file);
    }
    this.imageErrors.update(current => [...current, ...errors]);
    if (validFiles.length === 0) return;

    const queue = validFiles.map(file => ({
      file,
      item: { id: crypto.randomUUID(), fileName: file.name, file, uploadStatus: 'PENDING' as const },
    }));
    this.uploadItems.update(current => [...current, ...queue.map(entry => entry.item)]);

    if (this.tradeId) this.uploadQueuedImages(this.tradeId, queue.map(entry => entry.item));
  }

  onRetryFailedImages(): void {
    const tradeId = this.createdTradeId();
    const failedItems = this.uploadItems().filter(item => item.uploadStatus === 'ERROR');
    if (!tradeId || failedItems.length === 0 || this.isUploadingImages()) return;

    this.isSaving.set(true);
    this.saveStatus.set('UPLOADING');
    this.createUploadProgress.set({ completed: 0, total: failedItems.length });
    this.uploadQueuedImages(tradeId, failedItems, () => this.finishCreatedTradeUploads());
  }

  private uploadQueuedImages(tradeId: string, items: TradeImageUploadItem[], onComplete?: () => void): void {
    if (items.length === 0) {
      onComplete?.();
      return;
    }

    from(items).pipe(
      concatMap(item => {
        this.uploadItems.update(current => current.map(upload => upload.id === item.id
          ? { ...upload, uploadStatus: 'UPLOADING', error: undefined }
          : upload));
        return this.tradeService.uploadImage(tradeId, item.file).pipe(
          map(image => ({ image, uploadId: item.id, failed: false })),
        catchError(() => {
          this.uploadItems.update(current => current.map(upload => upload.id === item.id
            ? { ...upload, uploadStatus: 'ERROR', error: this.translate.instant('TRADES.IMAGES.ERRORS.UPLOAD_FAILED') }
            : upload));
          return of({ image: null, uploadId: item.id, failed: true });
        })
      ); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ image, uploadId, failed }) => {
        if (image) {
          this.images.update(current => [...current, image]);
          this.uploadItems.update(current => current.filter(upload => upload.id !== uploadId));
        }
        if (this.saveStatus() === 'UPLOADING') {
          this.createUploadProgress.update(progress => ({ ...progress, completed: progress.completed + 1 }));
        }
      },
      complete: () => onComplete?.(),
    });
  }

  onDeleteImage(image: TradeImage): void {
    if (!this.tradeId || this.deletingImageId()) return;
    this.deletingImageId.set(image.id);
    this.tradeService.deleteImage(this.tradeId, image.id).pipe(
      finalize(() => this.deletingImageId.set(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.images.update(current => current.filter(item => item.id !== image.id)),
      error: () => this.imageErrors.update(current => [...current, `${image.originalFileName}: ${this.translate.instant('TRADES.IMAGES.ERRORS.DELETE_FAILED')}`]),
    });
  }

  openLightbox(index: number): void {
    if (index < 0 || index >= this.images().length) return;
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  nextLightboxImage(): void {
    const total = this.images().length;
    const index = this.lightboxIndex();
    if (index === null || total < 2) return;
    this.lightboxIndex.set((index + 1) % total);
  }

  prevLightboxImage(): void {
    const total = this.images().length;
    const index = this.lightboxIndex();
    if (index === null || total < 2) return;
    this.lightboxIndex.set((index - 1 + total) % total);
  }

  onLightboxBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeLightbox();
  }

  @HostListener('window:keydown', ['$event'])
  onLightboxKeydown(event: KeyboardEvent): void {
    if (!this.isLightboxOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextLightboxImage();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevLightboxImage();
    }
  }

  fieldError(fieldName: string): string {
    const ctrl = this.form.get(fieldName);
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.hasError('required')) return this.translate.instant('ERRORS.REQUIRED');
    if (ctrl.hasError('maxlength')) {
      const max = (ctrl.getError('maxlength') as { requiredLength: number }).requiredLength;
      return this.translate.instant('ERRORS.MAX_LENGTH', { max });
    }
    if (ctrl.hasError('min')) {
      const min = (ctrl.getError('min') as { min: number }).min;
      return this.translate.instant(min === 0 ? 'ERRORS.MIN_VALUE' : 'TRADES.VALIDATION.POSITIVE_VALUE');
    }
    return '';
  }

  private loadLookups(): void {
    this.strategyService.getAll(new QueryBuilder().setPage(0, 500)).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.strategyOptions.set(
          (res.model ?? [])
            .filter(s => s.isActive)
            .map(s => ({ label: s.name, value: s.id }))
        );
      },
    });

    this.loadInstrumentLookup();

    this.accountService.getLookup().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.accountOptions.set(
          (res.model ?? [])
            .filter(a => a.isActive)
            .map(a => ({ id: a.id, label: a.display }))
        );
      },
    });
  }

  private loadTrade(): void {
    this.isLoading.set(true);
    this.tradeService.getById(this.tradeId!).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (trade: TradeDetails) => {
        this.hasTradeStrategy.set(!!trade.strategyId);
        this.form.patchValue({
          tradingInstrumentId: trade.tradingInstrumentId,
          strategyId: trade.strategyId,
          tradingAccountIds: trade.tradingAccountIds ?? [],
          direction: trade.direction,
          session: trade.session,
          status: trade.status,
          tradeDate: this.toDateValue(trade.tradeDate),
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          lotSize: trade.lotSize,
          riskAmount: trade.riskAmount,
          pnl: trade.pnl,
          notes: trade.notes ?? null,
        });
        this.loadImages();
        this.loadRuleChecks();
      },
      error: () => this.router.navigate(['/trades']),
    });
  }

  private submitCreate(): void {
    const value = this.form.getRawValue();
    const request: CreateTradeRequest = {
      tradingInstrumentId: value.tradingInstrumentId!,
      strategyId: value.strategyId!,
      tradingAccountIds: value.tradingAccountIds ?? [],
      direction: value.direction!,
      session: value.session ?? null,
      status: value.status!,
      tradeDate: value.tradeDate!,
      entryPrice: this.coerceNumber(value.entryPrice),
      exitPrice: this.coerceNumber(value.exitPrice),
      stopLoss: this.coerceNumber(value.stopLoss),
      takeProfit: this.coerceNumber(value.takeProfit),
      lotSize: this.coerceNumber(value.lotSize),
      riskAmount: this.coerceNumber(value.riskAmount),
      pnl: this.coerceNumber(value.pnl),
      notes: value.notes?.trim() || null,
    };

    this.saveStatus.set('CREATING');
    this.tradeService.create(request).subscribe({
      next: (res) => {
        this.toastService.success('TRADES.CREATE_SUCCESS');
        this.tradeId = res.id;
        this.createdTradeId.set(res.id);
        const pendingItems = this.uploadItems().filter(item => item.uploadStatus === 'PENDING');
        if (pendingItems.length === 0) {
          this.finishCreatedTradeUploads();
          return;
        }

        this.saveStatus.set('UPLOADING');
        this.createUploadProgress.set({ completed: 0, total: pendingItems.length });
        this.uploadQueuedImages(res.id, pendingItems, () => this.finishCreatedTradeUploads());
      },
      error: () => {
        this.isSaving.set(false);
        this.saveStatus.set(null);
      },
    });
  }

  private submitUpdate(): void {
    const value = this.form.getRawValue();
    const request: UpdateTradeRequest = {
      tradingInstrumentId: value.tradingInstrumentId!,
      strategyId: value.strategyId!,
      tradingAccountIds: value.tradingAccountIds ?? [],
      direction: value.direction!,
      session: value.session ?? null,
      status: value.status!,
      tradeDate: value.tradeDate!,
      entryPrice: this.coerceNumber(value.entryPrice),
      exitPrice: this.coerceNumber(value.exitPrice),
      stopLoss: this.coerceNumber(value.stopLoss),
      takeProfit: this.coerceNumber(value.takeProfit),
      lotSize: this.coerceNumber(value.lotSize),
      riskAmount: this.coerceNumber(value.riskAmount),
      pnl: this.coerceNumber(value.pnl),
      notes: value.notes?.trim() || null,
    };

    this.tradeService.update(this.tradeId!, request).pipe(
      finalize(() => {
        this.isSaving.set(false);
        this.saveStatus.set(null);
      })
    ).subscribe({
      next: () => this.toastService.success('TRADES.UPDATE_SUCCESS'),
    });
  }

  private coerceNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  private loadInstrumentLookup(selectedId?: string): void {
    this.instrumentService.getLookup().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.instrumentOptions.set(
          (res.model ?? [])
            .filter(instrument => instrument.isActive)
            .map(instrument => ({ label: instrument.display, value: instrument.id }))
        );
        if (selectedId) this.form.get('tradingInstrumentId')!.setValue(selectedId);
      },
    });
  }

  private loadImages(): void {
    if (!this.tradeId) return;
    this.isLoadingImages.set(true);
    this.tradeService.getImages(this.tradeId).pipe(
      finalize(() => this.isLoadingImages.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({ next: images => this.images.set(images) });
  }

  private finishCreatedTradeUploads(): void {
    this.isSaving.set(false);
    this.saveStatus.set(null);
    const failedCount = this.uploadItems().filter(item => item.uploadStatus === 'ERROR').length;
    if (failedCount > 0) return;
    this.router.navigate(['/trades', this.createdTradeId(), 'edit']);
  }

  private validateImage(file: File): string | null {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return this.translate.instant('TRADES.IMAGES.ERRORS.INVALID_TYPE');
    if (file.size === 0) return this.translate.instant('TRADES.IMAGES.ERRORS.EMPTY_FILE');
    if (file.size > 25 * 1024 * 1024) return this.translate.instant('TRADES.IMAGES.ERRORS.TOO_LARGE');
    return null;
  }

  private toDateValue(value: string | null | undefined): string | null {
    if (!value) return null;
    return value.slice(0, 10);
  }

  private updateDerivedState(): void {
    const value = this.form.getRawValue();
    const pnl = this.coerceNumber(value.pnl);
    const riskAmount = this.coerceNumber(value.riskAmount);
    this.rMultiplePreview.set(
      pnl !== null && riskAmount !== null && riskAmount > 0
        ? (pnl / riskAmount).toFixed(2)
        : '—'
    );

    const entryPrice = this.coerceNumber(value.entryPrice);
    const stopLoss = this.coerceNumber(value.stopLoss);
    const takeProfit = this.coerceNumber(value.takeProfit);
    const direction = value.direction;

    if (entryPrice === null || !direction) {
      this.priceWarningKey.set('');
    } else if (direction === 'Long' && stopLoss !== null && stopLoss >= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.LONG_STOP_LOSS');
    } else if (direction === 'Long' && takeProfit !== null && takeProfit <= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.LONG_TAKE_PROFIT');
    } else if (direction === 'Short' && stopLoss !== null && stopLoss <= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.SHORT_STOP_LOSS');
    } else if (direction === 'Short' && takeProfit !== null && takeProfit >= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.SHORT_TAKE_PROFIT');
    } else {
      this.priceWarningKey.set('');
    }
  }

  private enumKey(value: string): string {
    return value.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
  }
}
