import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export type AppBadgeVariant = 'neutral' | 'brand' | 'success' | 'danger' | 'warning';
export type AppBadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './app-badge.component.html',
  styleUrl: './app-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBadgeComponent {
  readonly variant = input<AppBadgeVariant>('neutral');
  readonly size = input<AppBadgeSize>('md');
  readonly icon = input<string>();
}
