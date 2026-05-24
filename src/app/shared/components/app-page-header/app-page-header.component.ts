import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIcon, TranslatePipe],
  templateUrl: './app-page-header.component.html',
  styleUrl: './app-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppPageHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly icon = input<string>();
}
