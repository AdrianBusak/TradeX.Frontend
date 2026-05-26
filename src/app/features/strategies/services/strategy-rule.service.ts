import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { StandardListResponse } from '../../../core/models/api-response.model';
import { QueryBuilder } from '../../../core/utils/query-builder';
import {
  CreateStrategyRuleRequest,
  StrategyRule,
  UpdateStrategyRuleRequest,
} from '../models/strategy.model';

@Injectable({ providedIn: 'root' })
export class StrategyRuleService {
  private readonly api = inject(ApiService);

  private base(strategyId: string): string {
    return `strategies/${strategyId}/rules`;
  }

  getAll(strategyId: string, params: QueryBuilder): Observable<StandardListResponse<StrategyRule>> {
    return this.api.getGrid<StrategyRule>(this.base(strategyId), params);
  }

  create(strategyId: string, request: CreateStrategyRuleRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(this.base(strategyId), request);
  }

  update(strategyId: string, ruleId: string, request: UpdateStrategyRuleRequest): Observable<object> {
    return this.api.put<object>(`${this.base(strategyId)}/${ruleId}`, request);
  }

  softDelete(strategyId: string, ruleId: string): Observable<object> {
    return this.api.delete<object>(`${this.base(strategyId)}/${ruleId}`);
  }

  hardDelete(strategyId: string, ruleId: string): Observable<object> {
    return this.api.delete<object>(`${this.base(strategyId)}/${ruleId}/hard`);
  }
}
