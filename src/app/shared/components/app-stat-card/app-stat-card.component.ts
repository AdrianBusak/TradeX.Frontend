import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AppCardComponent } from '../app-card/app-card.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [AppCardComponent, MatIcon],
  templateUrl: './app-stat-card.component.html',
  styleUrl: './app-stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly helper = input('');
  readonly trend = input('');
  readonly tone = input<'neutral' | 'positive' | 'negative' | 'warning'>('neutral');
  readonly icon = input<string>();
}
