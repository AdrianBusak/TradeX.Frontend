import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AppCardVariant = 'default' | 'muted' | 'outlined';
export type AppCardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './app-card.component.html',
  styleUrl: './app-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCardComponent {
  readonly variant = input<AppCardVariant>('default');
  readonly padding = input<AppCardPadding>('md');
  readonly interactive = input(false);
  readonly loading = input(false);
}
