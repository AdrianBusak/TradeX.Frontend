import { Component, HostBinding, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
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
  imports: [AsyncPipe, RouterLink, RouterLinkActive, TranslatePipe, MatIcon],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly sidebar = inject(SidebarService);

  @HostBinding('class.collapsed') get isCollapsed() { return this.sidebar.collapsed(); }
  @HostBinding('class.mobile-open') get isMobileOpen() { return this.sidebar.mobileOpen(); }

  readonly user$ = this.auth.user$;

  readonly mainNav: NavItem[] = [
    { labelKey: 'NAV.DASHBOARD',  route: '/dashboard',  icon: 'dashboard' },
    { labelKey: 'NAV.STOCK',      route: '/stock',       icon: 'show_chart' },
    { labelKey: 'NAV.FAVOURITES', route: '/favourites',  icon: 'star' },
    { labelKey: 'NAV.WALLET',     route: '/wallet',      icon: 'account_balance_wallet' }
  ];

  readonly bottomNav: NavItem[] = [
    { labelKey: 'NAV.COMMUNITY', route: '/community', icon: 'group' },
    { labelKey: 'NAV.PROFILE',   route: '/profile',   icon: 'person' },
    { labelKey: 'NAV.CONTACT',   route: '/contact',   icon: 'mail' }
  ];

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}
