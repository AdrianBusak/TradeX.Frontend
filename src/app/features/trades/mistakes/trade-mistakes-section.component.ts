import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';

import { ToastService } from '../../../core/services/toast.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { Mistake } from '../../mistakes/models/mistake.model';
import { MistakeService } from '../../mistakes/services/mistake.service';
import { TradeMistakeService } from '../../mistakes/services/trade-mistake.service';

@Component({
  selector: 'app-trade-mistakes-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, AppButtonComponent],
  templateUrl: './trade-mistakes-section.component.html',
  styleUrl: './trade-mistakes-section.component.scss',
})
export class TradeMistakesSectionComponent {
  private readonly mistakeService = inject(MistakeService);
  private readonly tradeMistakeService = inject(TradeMistakeService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tradeId = input.required<string>();
  readonly mistakeCatalog = signal<Mistake[]>([]);
  readonly selectedMistakes = signal<Map<string, string | null>>(new Map());
  readonly isLoading = signal(false);
  readonly loadFailed = signal(false);
  readonly isSaving = signal(false);

  constructor() {
    effect(() => {
      const tradeId = this.tradeId();
      if (tradeId) this.load();
    });
  }

  load(): void {
    const tradeId = this.tradeId();
    this.isLoading.set(true);
    this.loadFailed.set(false);

    this.mistakeService.getAll().pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: catalog => {
        this.mistakeCatalog.set(catalog ?? []);
        this.tradeMistakeService.getByTradeId(tradeId).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: response => {
            this.selectedMistakes.set(
              new Map(response.mistakes.map(item => [item.mistakeId, item.note ?? null]))
            );
          },
          error: () => this.loadFailed.set(true),
        });
      },
      error: () => this.loadFailed.set(true),
    });
  }

  isSelected(id: string): boolean {
    return this.selectedMistakes().has(id);
  }

  selectedCount(): number {
    return this.selectedMistakes().size;
  }

  toggle(id: string, event: Event): void {
    const selected = new Map(this.selectedMistakes());
    if ((event.target as HTMLInputElement).checked) selected.set(id, null);
    else selected.delete(id);
    this.selectedMistakes.set(selected);
  }

  setNote(id: string, event: Event): void {
    const selected = new Map(this.selectedMistakes());
    if (selected.has(id)) selected.set(id, (event.target as HTMLTextAreaElement).value);
    this.selectedMistakes.set(selected);
  }

  note(id: string): string {
    return this.selectedMistakes().get(id) ?? '';
  }

  save(): void {
    const tradeId = this.tradeId();
    if (this.isSaving()) return;

    const mistakes = [...this.selectedMistakes()].map(([mistakeId, note]) => ({
      mistakeId,
      note: note?.trim() || null,
    }));

    this.isSaving.set(true);
    this.tradeMistakeService.update(tradeId, { mistakes }).pipe(
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        this.selectedMistakes.set(
          new Map(response.mistakes.map(item => [item.mistakeId, item.note ?? null]))
        );
        this.toastService.success('TRADES.MISTAKES.SAVE_SUCCESS');
      },
    });
  }
}
