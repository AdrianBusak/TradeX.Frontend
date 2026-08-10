import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { TradeRuleChecksResponse, UpdateTradeRuleChecksRequest } from '../models/trade-rule-check.model';

@Injectable({ providedIn: 'root' })
export class TradeRuleCheckService {
  private readonly api = inject(ApiService);

  getByTradeId(tradeId: string): Observable<TradeRuleChecksResponse> {
    return this.api.get<TradeRuleChecksResponse>(`trades/${tradeId}/rule-checks`);
  }

  update(tradeId: string, request: UpdateTradeRuleChecksRequest): Observable<TradeRuleChecksResponse> {
    return this.api.put<TradeRuleChecksResponse>(`trades/${tradeId}/rule-checks`, request);
  }
}
