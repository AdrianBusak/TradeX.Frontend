import { Component, ChangeDetectionStrategy, input, output, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-search-field',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './search-field.component.html',
  styleUrls: ['./search-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent implements OnInit, OnDestroy {
  readonly placeholder = input('COMMON.SEARCH');
  readonly initialValue = input('');
  
  readonly searchChange = output<string>();

  readonly currentSearchValue = signal('');
  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.searchChange.emit(value);
      });
  }

  ngOnInit(): void {
    if (this.initialValue()) {
      this.currentSearchValue.set(this.initialValue());
    }
  }

  onSearch(value: string): void {
    this.currentSearchValue.set(value);
    this.searchInput$.next(value);
  }

  clearSearch(): void {
    this.currentSearchValue.set('');
    this.searchInput$.next('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
