import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-profit-loss-badge',
  standalone: true,
  templateUrl: './app-profit-loss-badge.component.html',
  styleUrl: './app-profit-loss-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppProfitLossBadgeComponent {
  readonly value = input(0);
  readonly format = input<'currency' | 'percent' | 'plain'>('currency');
  readonly currency = input('USD');

  readonly state = computed(() => this.value() > 0 ? 'profit' : this.value() < 0 ? 'loss' : 'flat');

  displayValue(): string {
    const value = this.value();
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    const absolute = Math.abs(value);

    if (this.format() === 'percent') {
      return `${sign}${absolute.toFixed(1)}%`;
    }

    if (this.format() === 'plain') {
      return `${sign}${absolute.toLocaleString()}`;
    }

    return `${sign}${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
      maximumFractionDigits: 0
    }).format(absolute)}`;
  }
}
