import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './app-metric-card.component.html',
  styleUrl: './app-metric-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppMetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly description = input('');
  readonly icon = input<string>();
  readonly tone = input<'neutral' | 'positive' | 'negative' | 'brand'>('neutral');
}
