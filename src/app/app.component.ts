import { Component, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { ApiService } from './core/api/api.service';
import { ToastHostComponent } from './core/components/toast-host/toast-host.component';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from './core/interceptors/http-context.tokens';

interface AccessState {
  isLoading: boolean;
  canEnter: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, TranslatePipe, ToastHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  private readonly loadingState: AccessState = { isLoading: true, canEnter: false };
  private readonly signedOutState: AccessState = { isLoading: false, canEnter: false };
  private readonly allowedState: AccessState = { isLoading: false, canEnter: true };

  readonly accessState$ = combineLatest([
    this.auth.isLoading$,
    this.auth.isAuthenticated$
  ]).pipe(
    distinctUntilChanged(([pl, pa], [cl, ca]) => pl === cl && pa === ca),
    switchMap(([isAuthLoading, isAuthenticated]) => {
      if (isAuthLoading) return of(this.loadingState);
      if (!isAuthenticated) return of(this.signedOutState);
      return this.api.get<unknown>('me', undefined, this.backendAccessContext()).pipe(
        map(() => this.allowedState),
        startWith(this.loadingState),
        catchError((error: unknown) => {
          console.error('Backend access check failed.', error);
          this.logout();
          return of(this.signedOutState);
        })
      );
    }),
    startWith(this.loadingState),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  private backendAccessContext(): HttpContext {
    return new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
  }
}
