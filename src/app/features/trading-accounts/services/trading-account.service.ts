import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { StandardListResponse } from '../../../core/models/api-response.model';
import { QueryBuilder } from '../../../core/utils/query-builder';
import {
  CreateTradingAccountRequest,
  TradingAccount,
  TradingAccountLookup,
  UpdateTradingAccountRequest,
} from '../models/trading-account.model';

@Injectable({ providedIn: 'root' })
export class TradingAccountService {
  private readonly api = inject(ApiService);
  private readonly base = 'trading-accounts';

  getAll(params: QueryBuilder): Observable<StandardListResponse<TradingAccount>> {
    return this.api.getGrid<TradingAccount>(this.base, params);
  }

  getById(id: string): Observable<TradingAccount> {
    return this.api.get<TradingAccount>(`${this.base}/${id}`);
  }

  getLookup(): Observable<StandardListResponse<TradingAccountLookup>> {
    return this.api.getGrid<TradingAccountLookup>(`${this.base}/lookup`);
  }

  create(request: CreateTradingAccountRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(this.base, request);
  }

  update(id: string, request: UpdateTradingAccountRequest): Observable<object> {
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
