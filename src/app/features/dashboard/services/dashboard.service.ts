import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { DashboardSummary, DashboardSummaryQuery } from '../models/dashboard-summary.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getTradingSummary(query: DashboardSummaryQuery): Observable<DashboardSummary> {
    return this.api.get<DashboardSummary>('/dashboard/trading-summary', {
      period: query.period,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      strategyId: query.strategyId,
      accountId: query.accountId
    });
  }
}
