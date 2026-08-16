import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { EconomicEventsResponse } from '../../../core/models/economic-calendar.model';

export interface EconomicEventsQuery {
  from: string;
  to: string;
  currency?: string | null;
  impact?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EconomicCalendarService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/v1/economic-events`;

  getEvents(query: EconomicEventsQuery): Observable<EconomicEventsResponse> {
    const filters = [
      query.currency && { fieldName: 'currency', filter: [{ op: 'Eq', value: query.currency }] },
      query.impact && { fieldName: 'impact', filter: [{ op: 'Eq', value: query.impact }] }
    ].filter(Boolean);

    return this.http
      .get<EconomicEventsResponse | { model?: EconomicEventsResponse; data?: EconomicEventsResponse }>(this.endpoint, {
        params: new HttpParams()
          .set('from', query.from)
          .set('to', query.to)
          .set('filters', JSON.stringify(filters))
      })
      .pipe(map(response => this.unwrapResponse(response)));
  }

  private unwrapResponse(
    response: EconomicEventsResponse | { model?: EconomicEventsResponse; data?: EconomicEventsResponse }
  ): EconomicEventsResponse {
    const payload = 'items' in response ? response : response.model ?? response.data;
    return { items: payload?.items ?? [], lastSyncedAt: payload?.lastSyncedAt ?? null };
  }
}
