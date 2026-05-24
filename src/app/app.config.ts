import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([authHttpInterceptorFn, errorInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (iconRegistry: MatIconRegistry) => () => {
        iconRegistry.setDefaultFontSetClass('material-symbols-outlined');
      },
      deps: [MatIconRegistry],
      multi: true
    },
    provideTranslateService({
      fallbackLang: 'en',
      lang: localStorage.getItem('tradex-lang') ?? 'en',
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      })
    }),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: environment.auth0.redirectUri,
        audience: environment.auth0.audience
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: `${environment.apiBaseUrl}/v1/*`,
            tokenOptions: {
              authorizationParams: {
                audience: environment.auth0.audience
              }
            }
          }
        ]
      }
    })
  ]
};
