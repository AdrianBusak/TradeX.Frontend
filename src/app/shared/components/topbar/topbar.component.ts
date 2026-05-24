import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { LangSwitcherComponent } from '../lang-switcher/lang-switcher.component';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [TranslatePipe, MatIcon, LangSwitcherComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  readonly sidebar = inject(SidebarService);
}
