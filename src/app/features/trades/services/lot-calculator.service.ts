import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { CalculateLotRequest, CalculateLotResponse } from '../models/lot-calculator.model';

@Injectable({ providedIn: 'root' })
export class LotCalculatorService {
  private readonly api = inject(ApiService);

  calculate(request: CalculateLotRequest): Observable<CalculateLotResponse> {
    return this.api.post<CalculateLotResponse>('lot-calculator/calculate', request);
  }
}
