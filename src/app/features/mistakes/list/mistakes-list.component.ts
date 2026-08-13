import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { PageLayoutComponent } from '../../../shared/components/layout/page-layout/page-layout.component';
import { AppLoadingStateComponent } from '../../../shared/components/app-loading-state/app-loading-state.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';
import { MistakeService } from '../services/mistake.service';
import { Mistake } from '../models/mistake.model';

@Component({
  selector: 'app-mistakes-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    PageLayoutComponent,
    AppButtonComponent,
    AppLoadingStateComponent,
  ],
  templateUrl: './mistakes-list.component.html',
  styleUrl: './mistakes-list.component.scss',
})
export class MistakesListComponent {
  private readonly service = inject(MistakeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  readonly mistakes = signal<Mistake[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  constructor() {
    this.load();
  }

  create(): void {
    this.router.navigate(['/mistakes/create']);
  }

  edit(id: string): void {
    this.router.navigate(['/mistakes', id, 'edit']);
  }

  retry(): void {
    this.load();
  }

  remove(mistake: Mistake): void {
    const data: ConfirmDialogData = {
      title: this.translate.instant('MISTAKES.CONFIRM_DELETE.TITLE'),
      message: this.translate.instant('MISTAKES.CONFIRM_DELETE.MESSAGE', { name: mistake.name }),
      confirmText: this.translate.instant('MISTAKES.DELETE'),
      cancelText: this.translate.instant('COMMON.ACTIONS.CANCEL'),
      type: 'danger',
    };

    this.dialog.open(ConfirmDialogComponent, { data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(mistake.id).subscribe({
        next: () => {
          this.toast.success('MISTAKES.DELETE_SUCCESS');
          this.load();
        },
      });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.service.getAll().pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: items => this.mistakes.set(items ?? []),
      error: () => this.loadFailed.set(true),
    });
  }
}
