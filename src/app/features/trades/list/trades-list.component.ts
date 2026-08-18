import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

import { QueryBuilder } from '../../../core/utils/query-builder';
import { SortDirection } from '../../../core/models/query-parameters.model';
import { ToastService } from '../../../core/services/toast.service';
import { PageLayoutComponent } from '../../../shared/components/layout/page-layout/page-layout.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { DataGridComponent, ColumnConfig, RowActionEvent } from '../../../shared/components/data-grid/data-grid.component';
import { loadGridState, patchGridState } from '../../../shared/components/data-grid/grid-state.util';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TradeService } from '../services/trade.service';
import { TradeListItem } from '../models/trade.model';

interface TradeRow extends Record<string, unknown> {
  id: string;
  symbol: string;
  marketTypeDisplay: string;
  strategyName: string;
  accountsDisplay: string;
  directionDisplay: string;
  sessionDisplay: string;
  statusDisplay: string;
  tradeDateDisplay: string;
  pnlDisplay: string;
  rMultipleDisplay: string;
  isActive: boolean;
}

@Component({
  selector: 'app-trades-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    PageLayoutComponent,
    AppButtonComponent,
    DataGridComponent,
  ],
  templateUrl: './trades-list.component.html',
  styleUrl: './trades-list.component.scss',
})
export class TradesListComponent {
  private readonly service = inject(TradeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly GRID_ID = 'trades';
  private readonly savedState = loadGridState(TradesListComponent.GRID_ID);

  readonly trades = signal<TradeListItem[]>([]);
  readonly totalRecords = signal(0);
  readonly pageIndex = signal(this.savedState?.pageIndex ?? 0);
  readonly pageSize = signal(this.savedState?.pageSize ?? 20);
  readonly isLoading = signal(false);
  readonly sortField = signal('');
  readonly sortDirection = signal<'Asc' | 'Desc'>('Desc');

  private readonly loadTrigger$ = new Subject<void>();

  readonly columns: ColumnConfig[] = [
    { key: 'symbol', headerKey: 'TRADES.COLUMNS.SYMBOL' },
    { key: 'marketTypeDisplay', headerKey: 'TRADES.COLUMNS.MARKET_TYPE', type: 'badge', translate: true },
    { key: 'strategyName', headerKey: 'TRADES.COLUMNS.STRATEGY' },
    { key: 'accountsDisplay', headerKey: 'TRADES.COLUMNS.ACCOUNTS' },
    { key: 'directionDisplay', headerKey: 'TRADES.COLUMNS.DIRECTION', type: 'badge', translate: true },
    { key: 'sessionDisplay', headerKey: 'TRADES.COLUMNS.SESSION' },
    { key: 'statusDisplay', headerKey: 'TRADES.COLUMNS.STATUS', type: 'badge', translate: true },
    { key: 'tradeDateDisplay', headerKey: 'TRADES.COLUMNS.TRADE_DATE', sortable: true, sortKey: 'tradeDate' },
    { key: 'pnlDisplay', headerKey: 'TRADES.COLUMNS.PNL' },
    { key: 'rMultipleDisplay', headerKey: 'TRADES.COLUMNS.R_MULTIPLE' },
    { key: 'isActive', headerKey: 'TRADES.COLUMNS.ACTIVE' },
    {
      key: 'actions',
      headerKey: 'COMMON.COLUMNS.ACTIONS',
      type: 'action',
      actionsResolver: (row) => (row as unknown as TradeRow).isActive
        ? ['edit', 'deactivate', 'hard-delete']
        : ['edit', 'restore', 'hard-delete'],
    },
  ];

  readonly mobileColumns = ['symbol', 'statusDisplay', 'pnlDisplay', 'actions'];

  readonly displayRows = computed<TradeRow[]>(() =>
    this.trades().map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      marketTypeDisplay: `STRATEGIES.MARKET_TYPES.${trade.marketType.toUpperCase()}`,
      strategyName: trade.strategyName,
      accountsDisplay: this.formatAccounts(trade),
      directionDisplay: `TRADES.DIRECTIONS.${trade.direction.toUpperCase()}`,
      sessionDisplay: trade.session
        ? this.translate.instant(`TRADES.SESSIONS.${this.enumKey(trade.session)}`)
        : '—',
      statusDisplay: `TRADES.STATUSES.${this.enumKey(trade.status)}`,
      tradeDateDisplay: this.formatDate(trade.tradeDate),
      pnlDisplay: this.formatNumber(trade.pnl),
      rMultipleDisplay: this.formatNumber(trade.rMultiple),
      isActive: trade.isActive,
    }))
  );

  constructor() {
    this.loadTrigger$.pipe(
      switchMap(() => {
        this.isLoading.set(true);
        return this.service.getAll(this.buildQuery()).pipe(
          finalize(() => this.isLoading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.trades.set(response.model ?? []);
        this.totalRecords.set(response.totalRecordCount);
      },
    });

    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    patchGridState(TradesListComponent.GRID_ID, {
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    });
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.direction ? sort.active : '');
    this.sortDirection.set(sort.direction === 'asc' ? 'Asc' : 'Desc');
    this.pageIndex.set(0);
    patchGridState(TradesListComponent.GRID_ID, { pageIndex: 0 });
    this.load();
  }

  onRowAction(event: RowActionEvent<TradeRow>): void {
    if (event.action === 'edit') {
      this.router.navigate(['/trades', event.row.id, 'edit']);
    } else if (event.action === 'deactivate') {
      this.confirmSoftDelete(event.row.id);
    } else if (event.action === 'restore') {
      this.restore(event.row.id);
    } else if (event.action === 'hard-delete') {
      this.confirmHardDelete(event.row.id);
    }
  }

  onCreate(): void {
    this.router.navigate(['/trades/create']);
  }

  private confirmSoftDelete(id: string): void {
    const data: ConfirmDialogData = {
      title: this.translate.instant('TRADES.CONFIRM_DELETE.TITLE'),
      message: this.translate.instant('TRADES.CONFIRM_DELETE.MESSAGE'),
      confirmText: this.translate.instant('TRADES.CONFIRM_DELETE.CONFIRM'),
      cancelText: this.translate.instant('COMMON.ACTIONS.CANCEL'),
      type: 'warning',
    };
    this.dialog.open(ConfirmDialogComponent, { data }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.softDelete(id);
    });
  }

  private softDelete(id: string): void {
    this.service.softDelete(id).subscribe({
      next: () => {
        this.toastService.success('TRADES.DELETE_SUCCESS');
        this.load();
      },
    });
  }

  private confirmHardDelete(id: string): void {
    const data: ConfirmDialogData = {
      title: this.translate.instant('TRADES.CONFIRM_HARD_DELETE.TITLE'),
      message: this.translate.instant('TRADES.CONFIRM_HARD_DELETE.MESSAGE'),
      confirmText: this.translate.instant('TRADES.CONFIRM_HARD_DELETE.CONFIRM'),
      cancelText: this.translate.instant('COMMON.ACTIONS.CANCEL'),
      type: 'danger',
    };
    this.dialog.open(ConfirmDialogComponent, { data }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.hardDelete(id);
    });
  }

  private hardDelete(id: string): void {
    this.service.hardDelete(id).subscribe({
      next: () => {
        this.toastService.success('TRADES.HARD_DELETE_SUCCESS');
        this.load();
      },
    });
  }

  private restore(id: string): void {
    this.service.restore(id).subscribe({
      next: () => {
        this.toastService.success('TRADES.RESTORE_SUCCESS');
        this.load();
      },
    });
  }

  private load(): void {
    this.loadTrigger$.next();
  }

  private buildQuery(): QueryBuilder {
    const query = new QueryBuilder().setPage(this.pageIndex(), this.pageSize());
    if (this.sortField()) {
      query.addSort(
        this.sortField(),
        this.sortDirection() === 'Asc' ? SortDirection.Asc : SortDirection.Desc
      );
    }
    return query;
  }

  private formatAccounts(trade: TradeListItem): string {
    const accounts = trade.tradingAccounts ?? [];
    if (accounts.length === 0) return '—';
    if (accounts.length === 1) return accounts[0].name;
    return `${accounts[0].name} +${accounts.length - 1}`;
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }

  private formatNumber(value: number | null | undefined): string {
    return value == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value);
  }

  private enumKey(value: string): string {
    return value.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
  }
}
