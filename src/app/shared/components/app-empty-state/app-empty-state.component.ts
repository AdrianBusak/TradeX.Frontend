import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './app-empty-state.component.html',
  styleUrl: './app-empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppEmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly description = input('');
}
