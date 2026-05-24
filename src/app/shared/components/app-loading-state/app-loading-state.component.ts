import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  templateUrl: './app-loading-state.component.html',
  styleUrl: './app-loading-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLoadingStateComponent {
  readonly label = input('Loading...');
}
