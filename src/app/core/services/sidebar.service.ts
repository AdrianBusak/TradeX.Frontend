import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly _collapsed = signal(false);
  private readonly _mobileOpen = signal(false);

  readonly collapsed = this._collapsed.asReadonly();
  readonly mobileOpen = this._mobileOpen.asReadonly();

  toggleCollapse(): void {
    this._collapsed.update(v => !v);
  }

  toggleMobile(): void {
    this._mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this._mobileOpen.set(false);
  }
}
