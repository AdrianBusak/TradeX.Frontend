import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { StandardListResponse } from '../../../core/models/api-response.model';
import {
  CreateTradingInstrumentRequest,
  TradingInstrumentLookup,
} from '../models/trading-instrument.model';

@Injectable({ providedIn: 'root' })
export class TradingInstrumentService {
  private readonly api = inject(ApiService);
  private readonly base = 'trading-instruments';

  getLookup(): Observable<StandardListResponse<TradingInstrumentLookup>> {
    return this.api.getGrid<TradingInstrumentLookup>(`${this.base}/lookup`);
  }

  create(request: CreateTradingInstrumentRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(this.base, request);
  }
}
