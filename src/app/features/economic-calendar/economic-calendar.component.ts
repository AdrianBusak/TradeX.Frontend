import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { finalize } from 'rxjs';

import {
  AppBadgeComponent,
  AppButtonComponent,
  AppCardComponent,
  AppEmptyStateComponent,
  AppPageHeaderComponent
} from '../../shared/components';
import {
  EconomicCalendarFilters,
  EconomicEvent,
  EconomicEventImpact
} from '../../core/models/economic-calendar.model';
import { EconomicCalendarService } from './services/economic-calendar.service';
import {
  addLocalDays,
  groupAndSortEvents,
  localDateKey,
  startOfLocalWeek
} from './economic-calendar.utils';

const EMPTY_FILTERS: EconomicCalendarFilters = { impact: null, currency: null };

@Component({
  selector: 'app-economic-calendar',
  standalone: true,
  imports: [
    MatIcon,
    AppBadgeComponent,
    AppButtonComponent,
    AppCardComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent
  ],
  templateUrl: './economic-calendar.component.html',
  styleUrl: './economic-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EconomicCalendarComponent {
  private readonly service = inject(EconomicCalendarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedDate = signal(new Date());
  readonly loadedWeek = signal<Date | null>(null);
  readonly events = signal<EconomicEvent[]>([]);
  readonly eventsByDay = computed(() => groupAndSortEvents(this.events()));
  readonly filters = signal<EconomicCalendarFilters>(EMPTY_FILTERS);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastSyncedAt = signal<string | null>(null);

  readonly weekDays = computed(() => {
    const week = startOfLocalWeek(this.selectedDate());

    return Array.from({ length: 7 }, (_, index) => {
      const date = addLocalDays(week, index);
      const dayEvents = this.eventsByDay()[localDateKey(date.toISOString())] ?? [];

      return {
        date,
        count: dayEvents.length,
        hasHighImpact: dayEvents.some(event => event.impact === 'High')
      };
    });
  });

  readonly currencyOptions = computed(() =>
    [...new Set(this.events().map(event => event.currency).filter(Boolean))].sort()
  );

  // The backend returns this selected day's events in chronological scheduledAt order.
  readonly selectedDayEvents = computed(() =>
    this.eventsByDay()[localDateKey(this.selectedDate().toISOString())] ?? []
  );

  readonly noStoredEvents = computed(() =>
    !this.loading() && !this.error() && this.events().length === 0
  );

  constructor() {
    this.loadSelectedDay();
  }

  selectDay(date: Date): void {
    this.selectedDate.set(date);
    this.loadSelectedDay();
  }

  previousDay(): void {
    this.navigateDay(-1);
  }

  nextDay(): void {
    this.navigateDay(1);
  }

  today(): void {
    this.selectedDate.set(new Date());
    this.loadSelectedDay();
  }

  retry(): void {
    this.loadSelectedDay();
  }

  setImpact(value: string): void {
    this.filters.update(filters => ({
      ...filters,
      impact: value ? value as EconomicEventImpact : null
    }));
    this.loadSelectedDay();
  }

  setCurrency(value: string): void {
    this.filters.update(filters => ({ ...filters, currency: value || null }));
    this.loadSelectedDay();
  }

  clearFilters(): void {
    this.filters.set(EMPTY_FILTERS);
    this.loadSelectedDay();
  }

  isSelected(date: Date): boolean {
    return localDateKey(date.toISOString()) === localDateKey(this.selectedDate().toISOString());
  }

  formatDay(date: Date): string {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
  }

  formatMonth(date: Date): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date);
  }

  formatTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  formatLastUpdated(): string | null {
    return this.lastSyncedAt() ? `Last updated ${this.formatTime(this.lastSyncedAt()!)}` : null;
  }

  valueOrDash(value: string | null | undefined): string {
    return value?.trim() || '—';
  }

  impactVariant(impact: EconomicEventImpact): 'danger' | 'warning' | 'brand' | 'neutral' {
    if (impact === 'High') return 'danger';
    if (impact === 'Medium') return 'warning';
    if (impact === 'Low') return 'brand';
    return 'neutral';
  }

  private navigateDay(offset: number): void {
    const next = addLocalDays(this.selectedDate(), offset);
    this.selectedDate.set(next);
    this.loadSelectedDay();
  }

  private loadSelectedDay(): void {
    const date = this.selectedDate();
    const from = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const to = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1));

    this.loading.set(true);
    this.error.set(null);

    this.service.getEvents({ from: from.toISOString(), to: to.toISOString(), ...this.filters() }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        this.events.set(response.items ?? []);
        this.lastSyncedAt.set(response.lastSyncedAt ?? null);
        this.loadedWeek.set(startOfLocalWeek(date));
      },
      error: () => this.error.set(
        this.events().length
          ? 'Refresh failed. Showing previously loaded events.'
          : 'Could not load economic events.'
      )
    });
  }
}
