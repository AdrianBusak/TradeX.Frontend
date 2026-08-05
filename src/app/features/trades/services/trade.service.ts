import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { StandardListResponse } from '../../../core/models/api-response.model';
import { QueryBuilder } from '../../../core/utils/query-builder';
import {
  CreateTradeRequest,
  TradeDetails,
  TradeListItem,
  UpdateTradeRequest,
} from '../models/trade.model';

@Injectable({ providedIn: 'root' })
export class TradeService {
  private readonly api = inject(ApiService);
  private readonly base = 'trades';

  getAll(params: QueryBuilder): Observable<StandardListResponse<TradeListItem>> {
    return this.api.getGrid<TradeListItem>(this.base, params);
  }

  getById(id: string): Observable<TradeDetails> {
    return this.api.get<TradeDetails>(`${this.base}/${id}`);
  }

  create(request: CreateTradeRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(this.base, request);
  }

  update(id: string, request: UpdateTradeRequest): Observable<object> {
    return this.api.put<object>(`${this.base}/${id}`, request);
  }

  softDelete(id: string): Observable<object> {
    return this.api.delete<object>(`${this.base}/${id}`);
  }

  restore(id: string): Observable<object> {
    return this.api.patch<object>(`${this.base}/${id}/restore`, {});
  }

  hardDelete(id: string): Observable<object> {
    return this.api.delete<object>(`${this.base}/${id}/hard`);
  }
}
