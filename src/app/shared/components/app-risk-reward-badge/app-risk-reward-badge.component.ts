import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-risk-reward-badge',
  standalone: true,
  templateUrl: './app-risk-reward-badge.component.html',
  styleUrl: './app-risk-reward-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppRiskRewardBadgeComponent {
  readonly ratio = input(0);

  readonly state = computed(() => {
    if (this.ratio() >= 2) return 'strong';
    if (this.ratio() >= 1) return 'balanced';
    return 'weak';
  });
}
