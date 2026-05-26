import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { StandardListResponse } from '../../../core/models/api-response.model';
import { QueryBuilder } from '../../../core/utils/query-builder';
import {
  CreateStrategyRequest,
  Strategy,
  UpdateStrategyRequest,
} from '../models/strategy.model';

@Injectable({ providedIn: 'root' })
export class StrategyService {
  private readonly api = inject(ApiService);
  private readonly base = 'strategies';

  getAll(params: QueryBuilder): Observable<StandardListResponse<Strategy>> {
    return this.api.getGrid<Strategy>(this.base, params);
  }

  getById(id: string): Observable<Strategy> {
    return this.api.get<Strategy>(`${this.base}/${id}`);
  }

  create(request: CreateStrategyRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(this.base, request);
  }

  update(id: string, request: UpdateStrategyRequest): Observable<object> {
    return this.api.put<object>(`${this.base}/${id}`, request);
  }

  softDelete(id: string): Observable<object> {
    return this.api.delete<object>(`${this.base}/${id}`);
  }

  hardDelete(id: string): Observable<object> {
    return this.api.delete<object>(`${this.base}/${id}/hard`);
  }
}
