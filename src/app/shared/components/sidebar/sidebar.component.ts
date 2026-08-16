import { Component, HostBinding, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { SidebarService } from '../../../core/services/sidebar.service';

interface NavItem {
  labelKey: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, MatIcon],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly sidebar = inject(SidebarService);

  @HostBinding('class.collapsed') get isCollapsed(): boolean { return this.sidebar.collapsed(); }
  @HostBinding('class.mobile-open') get isMobileOpen(): boolean { return this.sidebar.mobileOpen(); }

  readonly navItems: NavItem[] = [
    { labelKey: 'NAV.DASHBOARD', route: '/dashboard', icon: 'space_dashboard' },
    { labelKey: 'NAV.ECONOMIC_CALENDAR', route: '/economic-calendar', icon: 'calendar_month' },
    { labelKey: 'NAV.TRADING_ACCOUNTS', route: '/trading-accounts', icon: 'account_balance' },
    { labelKey: 'NAV.TRADES', route: '/trades', icon: 'candlestick_chart' },
    { labelKey: 'NAV.STRATEGIES', route: '/strategies', icon: 'schema' },
    { labelKey: 'NAV.MISTAKES', route: '/mistakes', icon: 'warning_amber' },
    { labelKey: 'NAV.ML_PREDICTION', route: '/ml-prediction', icon: 'model_training' },
    { labelKey: 'NAV.LOT_CALCULATOR', route: '/lot-calculator', icon: 'calculate' }
  ];
}
