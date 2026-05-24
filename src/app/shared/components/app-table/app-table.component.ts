import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AppBadgeComponent, AppBadgeVariant } from '../app-badge/app-badge.component';
import { AppEmptyStateComponent } from '../app-empty-state/app-empty-state.component';
import { AppLoadingStateComponent } from '../app-loading-state/app-loading-state.component';
import { AppProfitLossBadgeComponent } from '../app-profit-loss-badge/app-profit-loss-badge.component';
import { AppRiskRewardBadgeComponent } from '../app-risk-reward-badge/app-risk-reward-badge.component';

export type AppTableCellType = 'text' | 'badge' | 'profitLoss' | 'riskReward';
export type AppTableAlign = 'left' | 'center' | 'right';
export type AppTableDensity = 'compact' | 'comfortable';

export interface AppTableColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  type?: AppTableCellType;
  align?: AppTableAlign;
  badgeVariant?: AppBadgeVariant | ((row: T) => AppBadgeVariant);
  formatter?: (value: unknown, row: T) => string;
}

export interface AppTableAction<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  label: string;
  icon: string;
  tone?: 'neutral' | 'danger';
  disabled?: (row: T) => boolean;
}

export interface AppTableActionEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  action: string;
  row: T;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    MatIcon,
    AppBadgeComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppProfitLossBadgeComponent,
    AppRiskRewardBadgeComponent
  ],
  templateUrl: './app-table.component.html',
  styleUrl: './app-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly columns = input.required<AppTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly actions = input<AppTableAction<T>[]>([]);
  readonly loading = input(false);
  readonly emptyTitle = input('No records');
  readonly emptyDescription = input('');
  readonly density = input<AppTableDensity>('comfortable');
  readonly trackByKey = input<string>('id');

  readonly rowAction = output<AppTableActionEvent<T>>();

  cellValue(row: T, column: AppTableColumn<T>): unknown {
    return row[column.key];
  }

  displayValue(row: T, column: AppTableColumn<T>): string {
    const value = this.cellValue(row, column);
    return column.formatter ? column.formatter(value, row) : String(value ?? '-');
  }

  numericValue(row: T, column: AppTableColumn<T>): number {
    const value = this.cellValue(row, column);
    return typeof value === 'number' ? value : Number(value) || 0;
  }

  badgeVariant(row: T, column: AppTableColumn<T>): AppBadgeVariant {
    if (typeof column.badgeVariant === 'function') return column.badgeVariant(row);
    return column.badgeVariant ?? 'neutral';
  }

  isActionDisabled(action: AppTableAction<T>, row: T): boolean {
    return !!action.disabled?.(row);
  }

  rowKey(row: T, index: number): unknown {
    return row[this.trackByKey()] ?? index;
  }

  emitAction(action: AppTableAction<T>, row: T): void {
    if (this.isActionDisabled(action, row)) return;
    this.rowAction.emit({ action: action.id, row });
  }
}
