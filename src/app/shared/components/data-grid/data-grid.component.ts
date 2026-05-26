import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  Input,
  OnDestroy,
  OnInit,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GridRowActionsComponent } from '../grid-row-actions/grid-row-actions.component';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';

export interface ColumnConfig {
  key: string;
  headerKey: string;
  sortable?: boolean;
  sortKey?: string;
  type?: 'text' | 'action' | 'toggle' | 'badge';
  translate?: boolean;
  disableWhenField?: string;
  actions?: GridAction[];
  actionsResolver?: (row: Record<string, unknown>) => GridAction[];
}

export type GridAction = 'view' | 'edit' | 'delete' | 'deactivate' | 'hard-delete' | 'duplicate' | 'archive' | 'restore';

export interface RowActionEvent<T> {
  action: string;
  row: T;
  value?: unknown;
}

interface GridState {
  pageIndex: number;
  pageSize: number;
  sort: Sort | null;
  lastEditedId?: string | number;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIcon,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    GridRowActionsComponent,
  ],
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridComponent<T extends { id?: number | string }>
  implements OnInit, OnDestroy
{
  private breakpointObserver = inject(BreakpointObserver);

  readonly id = input.required<string>();
  readonly columns = input.required<ColumnConfig[]>();
  readonly dataSource = input.required<T[]>();
  readonly totalRecords = input.required<number>();
  readonly pageIndex = input(0);
  readonly pageSize = input(20);
  readonly pageSizeOptions = input([10, 20, 50]);
  readonly mobileVisibleColumns = input<string[]>([]);
  readonly isFiltered = input(false);
  readonly emptyMessageKey = input('COMMON.NO_DATA');
  readonly noResultsMessageKey = input('COMMON.NO_RESULTS');

  @Input() loading = false;

  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<Sort>();
  readonly rowAction = output<RowActionEvent<T>>();

  private readonly destroy$ = new Subject<void>();
  private readonly paginatorIntl = inject(MatPaginatorIntl);
  private readonly translate = inject(TranslateService);

  readonly sort = signal<Sort | null>(null);
  readonly highlightedRowId = signal<string | number | null>(null);

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(map(result => result.matches)),
    { initialValue: false }
  );

  readonly displayedColumns = computed(() => {
    const cols = this.columns();
    const isMobileView = this.isMobile();
    
    if (isMobileView) {
      const mobileKeys = this.mobileVisibleColumns();
      if (!mobileKeys || mobileKeys.length === 0) {
        return cols.map((c) => c.key);
      }
      return cols
        .filter((c) => mobileKeys.includes(c.key))
        .map((c) => c.key);
    }
    
    return cols.map((c) => c.key);
  });

  constructor() {
    this.updatePaginatorLabels();
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updatePaginatorLabels());

    effect(() => {
      const data = this.dataSource();
      const lastEditedId = this.getLastEditedId();
      
      if (lastEditedId && data.some(row => row.id === lastEditedId)) {
        this.highlightedRowId.set(lastEditedId);
        setTimeout(() => {
          this.highlightedRowId.set(null);
          this.clearLastEditedId();
        }, 3000);
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getStorageKey(): string {
    return `data-grid-${this.id()}`;
  }

  saveLastEditedId(id: string | number): void {
    const key = this.getStorageKey();
    const savedState = localStorage.getItem(key);
    let state: GridState;
    
    if (savedState) {
      state = JSON.parse(savedState);
    } else {
      state = {
        pageIndex: 0,
        pageSize: 20,
        sort: null
      };
    }
    
    state.lastEditedId = id;
    localStorage.setItem(key, JSON.stringify(state));
  }

  private getLastEditedId(): string | number | null {
    const key = this.getStorageKey();
    const savedState = localStorage.getItem(key);
    
    if (savedState) {
      try {
        const state: GridState = JSON.parse(savedState);
        return state.lastEditedId || null;
      } catch {
        return null;
      }
    }
    
    return null;
  }

  private clearLastEditedId(): void {
    const key = this.getStorageKey();
    const savedState = localStorage.getItem(key);
    
    if (savedState) {
      try {
        const state: GridState = JSON.parse(savedState);
        delete state.lastEditedId;
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error('Error clearing last edited id:', error);
      }
    }
  }

  isRowHighlighted(row: T): boolean {
    return this.highlightedRowId() === row.id;
  }

  onSortChange(sort: Sort): void {
    const column = this.columns().find((c) => c.key === sort.active);
    const sortField = column?.sortKey || sort.active;

    const modifiedSort: Sort = {
      active: sortField,
      direction: sort.direction,
    };

    this.sort.set(modifiedSort);
    this.sortChange.emit(modifiedSort);
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onRowAction(action: string, row: T): void {
    if (action === 'edit' && row.id) {
      this.saveLastEditedId(row.id);
    }
    this.rowAction.emit({ action, row });
  }

  getActions(column: ColumnConfig, row?: T): GridAction[] {
    if (column.actionsResolver && row) {
      return column.actionsResolver(row as Record<string, unknown>);
    }
    return column.actions?.length ? column.actions : ['edit'];
  }

  isActionDisabled(column: ColumnConfig, row: T): boolean {
    return !!column.disableWhenField && !(row as Record<string, unknown>)[column.disableWhenField];
  }

  getActionIcon(action: GridAction): string {
    switch (action) {
      case 'view':        return 'visibility';
      case 'delete':      return 'delete';
      case 'deactivate':  return 'toggle_off';
      case 'hard-delete': return 'delete_forever';
      case 'restore':     return 'restore';
      case 'duplicate':   return 'content_copy';
      case 'archive':     return 'archive';
      default:            return 'edit';
    }
  }

  getActionLabel(action: GridAction): string {
    return `COMMON.ACTIONS.${action.toUpperCase()}`;
  }

  onToggle(key: string, row: T, checked: boolean): void {
    this.rowAction.emit({ action: `toggle:${key}`, row, value: checked });
  }

  getColumnConfig(key: string): ColumnConfig | undefined {
    return this.columns().find((c) => c.key === key);
  }

  private updatePaginatorLabels(): void {
    const t = (key: string) => this.translate.instant(key);
    const ofLabel = t('COMMON.PAGINATOR.OF');

    this.paginatorIntl.itemsPerPageLabel = t('COMMON.PAGINATOR.ITEMS_PER_PAGE');
    this.paginatorIntl.nextPageLabel = t('COMMON.PAGINATOR.NEXT_PAGE');
    this.paginatorIntl.previousPageLabel = t('COMMON.PAGINATOR.PREVIOUS_PAGE');
    this.paginatorIntl.firstPageLabel = t('COMMON.PAGINATOR.FIRST_PAGE');
    this.paginatorIntl.lastPageLabel = t('COMMON.PAGINATOR.LAST_PAGE');
    this.paginatorIntl.getRangeLabel = (
      page: number,
      pageSize: number,
      length: number
    ) => {
      if (length === 0 || pageSize === 0) {
        return `0 ${ofLabel} ${length}`;
      }
      const startIndex = page * pageSize;
      const endIndex = Math.min(startIndex + pageSize, length);
      return `${startIndex + 1} - ${endIndex} ${ofLabel} ${length}`;
    };

    this.paginatorIntl.changes.next();
  }
}
