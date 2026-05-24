import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppCardComponent } from '../../shared/components/app-card/app-card.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';
import { AppPageHeaderComponent } from '../../shared/components/app-page-header/app-page-header.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [AppButtonComponent, AppCardComponent, AppEmptyStateComponent, AppPageHeaderComponent],
  template: `
    <div class="tx-page">
      <app-page-header
        [title]="title"
        [subtitle]="subtitle"
        [icon]="icon"
      />

      <app-card padding="none">
        <app-empty-state
          [icon]="icon"
          [title]="emptyTitle"
          [description]="emptyDescription"
        >
          <app-button variant="secondary" icon="add">Create first item</app-button>
        </app-empty-state>
      </app-card>
    </div>
  `
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.data['title'] ?? 'Page';
  readonly subtitle = this.route.snapshot.data['subtitle'] ?? 'This workspace section is ready for TradeX components.';
  readonly icon = this.route.snapshot.data['icon'] ?? 'dashboard';
  readonly emptyTitle = this.route.snapshot.data['emptyTitle'] ?? 'Nothing here yet';
  readonly emptyDescription = this.route.snapshot.data['emptyDescription'] ?? 'Use the shared TradeX UI components to build this workflow.';
}
