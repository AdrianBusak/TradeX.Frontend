import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface AppTabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './app-tabs.component.html',
  styleUrl: './app-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppTabsComponent {
  readonly tabs = input.required<AppTabItem[]>();
  readonly activeId = input<string>();

  readonly activeIdChange = output<string>();

  isActive(tab: AppTabItem): boolean {
    return (this.activeId() ?? this.tabs()[0]?.id) === tab.id;
  }

  select(tab: AppTabItem): void {
    if (!tab.disabled) {
      this.activeIdChange.emit(tab.id);
    }
  }
}
