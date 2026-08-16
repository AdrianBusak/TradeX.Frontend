import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AppCardComponent } from '../../shared/components/app-card/app-card.component';
import { AppPageHeaderComponent } from '../../shared/components/app-page-header/app-page-header.component';
import { LotCalculatorFormComponent } from '../trades/lot-calculator-dialog/lot-calculator-form.component';

@Component({
  selector: 'app-lot-calculator-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, AppCardComponent, AppPageHeaderComponent, LotCalculatorFormComponent],
  template: `
    <div class="tx-page">
      <app-page-header
        [title]="'LOT_CALCULATOR.TITLE' | translate"
        [subtitle]="'LOT_CALCULATOR.PAGE_SUBTITLE' | translate"
        icon="calculate" />

      <app-card padding="none">
        <app-lot-calculator-form />
      </app-card>
    </div>
  `,
})
export class LotCalculatorPageComponent {}
