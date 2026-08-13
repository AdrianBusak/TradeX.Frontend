import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { GetTradeMistakesResponse, UpdateTradeMistakesRequest } from '../models/mistake.model';

@Injectable({ providedIn: 'root' })
export class TradeMistakeService {
  private readonly api = inject(ApiService);

  getByTradeId(tradeId: string): Observable<GetTradeMistakesResponse> {
    return this.api.get<GetTradeMistakesResponse>(`trades/${tradeId}/mistakes`);
  }

  update(tradeId: string, request: UpdateTradeMistakesRequest): Observable<GetTradeMistakesResponse> {
    return this.api.put<GetTradeMistakesResponse>(`trades/${tradeId}/mistakes`, request);
  }
}
