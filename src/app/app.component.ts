import { Component, DestroyRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { EMPTY } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  isLoading$ = this.auth.isLoading$;
  isAuthenticated$ = this.auth.isAuthenticated$;
  user$ = this.auth.user$;

  constructor() {
    this.auth.isAuthenticated$.pipe(
      filter((isAuthenticated) => isAuthenticated),
      switchMap(() =>
        this.http.get(`${environment.apiBaseUrl}/v1/me`).pipe(
          catchError((error: unknown) => {
            console.error('Failed to sync authenticated user with backend.', error);
            return EMPTY;
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}
