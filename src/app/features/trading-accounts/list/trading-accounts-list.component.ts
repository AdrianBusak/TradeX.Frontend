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

import { QueryBuilder } from '../../../core/utils/query-builder';
import { FilterQueryOperation, SortDirection } from '../../../core/models/query-parameters.model';
import { ToastService } from '../../../core/services/toast.service';
import { PageLayoutComponent } from '../../../shared/components/layout/page-layout/page-layout.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { DataGridComponent, ColumnConfig, RowActionEvent } from '../../../shared/components/data-grid/data-grid.component';
import { loadGridState, patchGridState } from '../../../shared/components/data-grid/grid-state.util';
import { SearchFieldComponent } from '../../../shared/components/filters/search-field/search-field.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TradingAccountService } from '../services/trading-account.service';
import { TradingAccount, TradingAccountType } from '../models/trading-account.model';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

interface TradingAccountRow extends TradingAccount {
  accountTypeDisplay: string;
  currentBalanceDisplay: string;
}

@Component({
  selector: 'app-trading-accounts-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    PageLayoutComponent,
    AppButtonComponent,
    DataGridComponent,
    SearchFieldComponent,
  ],
  templateUrl: './trading-accounts-list.component.html',
  styleUrl: './trading-accounts-list.component.scss',
})
export class TradingAccountsListComponent {
  private readonly service = inject(TradingAccountService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly GRID_ID = 'trading-accounts';
  private readonly savedState = loadGridState(TradingAccountsListComponent.GRID_ID);

  readonly accounts = signal<TradingAccount[]>([]);
  readonly totalRecords = signal(0);
  readonly pageIndex = signal(this.savedState?.pageIndex ?? 0);
  readonly pageSize = signal(this.savedState?.pageSize ?? 20);
  readonly isLoading = signal(false);
  readonly searchValue = signal('');
  readonly sortField = signal('');
  readonly sortDirection = signal<'Asc' | 'Desc'>('Asc');

  private readonly loadTrigger$ = new Subject<void>();

  readonly columns: ColumnConfig[] = [
    { key: 'name', headerKey: 'TRADING_ACCOUNTS.COLUMNS.NAME', sortable: true, sortKey: 'name' },
    { key: 'accountTypeDisplay', headerKey: 'TRADING_ACCOUNTS.COLUMNS.ACCOUNT_TYPE', type: 'badge', translate: true, sortable: true, sortKey: 'accountType' },
    { key: 'broker', headerKey: 'TRADING_ACCOUNTS.COLUMNS.BROKER', sortable: true, sortKey: 'broker' },
    { key: 'currency', headerKey: 'TRADING_ACCOUNTS.COLUMNS.CURRENCY', sortable: true, sortKey: 'currency' },
    { key: 'currentBalanceDisplay', headerKey: 'TRADING_ACCOUNTS.COLUMNS.CURRENT_BALANCE' },
    { key: 'isActive', headerKey: 'TRADING_ACCOUNTS.COLUMNS.STATUS' },
    {
      key: 'actions',
      headerKey: 'COMMON.COLUMNS.ACTIONS',
      type: 'action',
      actionsResolver: (row) => (row as unknown as TradingAccountRow).isActive
        ? ['edit', 'deactivate', 'hard-delete']
        : ['edit', 'restore', 'hard-delete'],
    },
  ];

  readonly mobileColumns = ['name', 'currentBalanceDisplay', 'actions'];

  private readonly accountTypeKeyMap: Record<TradingAccountType, string> = {
    Personal: 'TRADING_ACCOUNTS.ACCOUNT_TYPES.PERSONAL',
    Demo: 'TRADING_ACCOUNTS.ACCOUNT_TYPES.DEMO',
    PropChallenge: 'TRADING_ACCOUNTS.ACCOUNT_TYPES.PROP_CHALLENGE',
    PropFunded: 'TRADING_ACCOUNTS.ACCOUNT_TYPES.PROP_FUNDED',
    BrokerLive: 'TRADING_ACCOUNTS.ACCOUNT_TYPES.BROKER_LIVE',
  };

  readonly displayRows = computed<TradingAccountRow[]>(() =>
    this.accounts().map(account => ({
      ...account,
      accountTypeDisplay: this.accountTypeKeyMap[account.accountType],
      currentBalanceDisplay: this.formatBalance(account.currentBalance, account.currency),
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
        this.accounts.set(response.model ?? []);
        this.totalRecords.set(response.totalRecordCount);
      },
    });

    this.load();
  }

  onSearchChange(search: string): void {
    this.searchValue.set(search);
    this.pageIndex.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    patchGridState(TradingAccountsListComponent.GRID_ID, {
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    });
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.direction ? sort.active : '');
    this.sortDirection.set(sort.direction === 'desc' ? 'Desc' : 'Asc');
    this.pageIndex.set(0);
    patchGridState(TradingAccountsListComponent.GRID_ID, { pageIndex: 0 });
    this.load();
  }

  onRowAction(event: RowActionEvent<TradingAccountRow>): void {
    if (event.action === 'edit') {
      this.router.navigate(['/trading-accounts', event.row.id, 'edit']);
    } else if (event.action === 'deactivate') {
      this.confirmSoftDelete(event.row.id);
    } else if (event.action === 'restore') {
      this.restore(event.row.id);
    } else if (event.action === 'hard-delete') {
      this.confirmHardDelete(event.row.id);
    }
  }

  onCreate(): void {
    this.router.navigate(['/trading-accounts/create']);
  }

  private confirmSoftDelete(id: string): void {
    const data: ConfirmDialogData = {
      title: this.translate.instant('TRADING_ACCOUNTS.CONFIRM_DELETE.TITLE'),
      message: this.translate.instant('TRADING_ACCOUNTS.CONFIRM_DELETE.MESSAGE'),
      confirmText: this.translate.instant('TRADING_ACCOUNTS.CONFIRM_DELETE.CONFIRM'),
      cancelText: this.translate.instant('COMMON.ACTIONS.CANCEL'),
      type: 'warning',
    };

    this.dialog.open(ConfirmDialogComponent, { data }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.softDelete(id);
      }
    });
  }

  private softDelete(id: string): void {
    this.service.softDelete(id).subscribe({
      next: () => {
        this.toastService.success('TRADING_ACCOUNTS.DELETE_SUCCESS');
        this.load();
      },
    });
  }

  private confirmHardDelete(id: string): void {
    const data: ConfirmDialogData = {
      title: this.translate.instant('TRADING_ACCOUNTS.CONFIRM_HARD_DELETE.TITLE'),
      message: this.translate.instant('TRADING_ACCOUNTS.CONFIRM_HARD_DELETE.MESSAGE'),
      confirmText: this.translate.instant('TRADING_ACCOUNTS.CONFIRM_HARD_DELETE.CONFIRM'),
      cancelText: this.translate.instant('COMMON.ACTIONS.CANCEL'),
      type: 'danger',
    };

    this.dialog.open(ConfirmDialogComponent, { data }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.hardDelete(id);
      }
    });
  }

  private hardDelete(id: string): void {
    this.service.hardDelete(id).subscribe({
      next: () => {
        this.toastService.success('TRADING_ACCOUNTS.HARD_DELETE_SUCCESS');
        this.load();
      },
    });
  }

  private restore(id: string): void {
    this.service.restore(id).subscribe({
      next: () => {
        this.toastService.success('TRADING_ACCOUNTS.RESTORE_SUCCESS');
        this.load();
      },
      error: () => this.load(),
    });
  }

  private load(): void {
    this.loadTrigger$.next();
  }

  private buildQuery(): QueryBuilder {
    const qb = new QueryBuilder().setPage(this.pageIndex(), this.pageSize());

    if (this.searchValue()) {
      qb.addFilter('search', FilterQueryOperation.Contains, this.searchValue());
    }

    if (this.sortField()) {
      qb.addSort(
        this.sortField(),
        this.sortDirection() === 'Desc' ? SortDirection.Desc : SortDirection.Asc
      );
    }

    return qb;
  }

  private formatBalance(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }
}
