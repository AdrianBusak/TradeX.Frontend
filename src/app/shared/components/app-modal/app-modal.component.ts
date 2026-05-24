import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AppButtonComponent, AppButtonVariant } from '../app-button/app-button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [MatIcon, AppButtonComponent],
  templateUrl: './app-modal.component.html',
  styleUrl: './app-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppModalComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly open = input(false);
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly confirmVariant = input<AppButtonVariant>('primary');
  readonly confirmDisabled = input(false);

  readonly closed = output<void>();
  readonly confirmed = output<void>();
}
