import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { filter, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LangSwitcherComponent } from '../lang-switcher/lang-switcher.component';
import { SidebarService } from '../../../core/services/sidebar.service';
import { LotCalculatorDialogComponent, LotCalculatorDialogData } from '../../../features/trades/lot-calculator-dialog/lot-calculator-dialog.component';

interface AuthUser {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [AsyncPipe, TranslatePipe, MatIcon, LangSwitcherComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  readonly sidebar = inject(SidebarService);
  readonly user$ = this.auth.user$;
  readonly titleKey = signal('NAV.DASHBOARD');

  userMenuOpen = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.titleKey.set(this.resolveTitleKey()));
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  openLotCalculator(): void {
    const data: LotCalculatorDialogData = {
      tradingAccountId: null,
      tradingInstrumentId: null,
      entryPrice: null,
      stopLossPrice: null,
    };
    this.dialog.open(LotCalculatorDialogComponent, { data, width: '720px', maxWidth: '95vw' });
  }

  initials(user: AuthUser | null | undefined): string {
    const value = user?.name || user?.email || 'TX';
    return value.split(' ').map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  private resolveTitleKey(): string {
    let active = this.route.root;
    while (active.firstChild) {
      active = active.firstChild;
    }
    return active.snapshot.data['titleKey'] ?? 'NAV.DASHBOARD';
  }
}
