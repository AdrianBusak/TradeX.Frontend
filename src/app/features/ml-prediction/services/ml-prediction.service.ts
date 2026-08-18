import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import {
  MlReadinessResponse,
  MlScoreRequest,
  MlScoreResponse,
  MlTrainResponse,
} from '../models/ml-prediction.model';

@Injectable({ providedIn: 'root' })
export class MlPredictionService {
  private readonly api = inject(ApiService);
  private readonly base = 'ml/pre-trade';

  getReadiness(): Observable<MlReadinessResponse> {
    return this.api.get<MlReadinessResponse>(`${this.base}/readiness`);
  }

  train(): Observable<MlTrainResponse> {
    return this.api.post<MlTrainResponse>(`${this.base}/train`, {});
  }

  score(request: MlScoreRequest): Observable<MlScoreResponse> {
    return this.api.post<MlScoreResponse>(`${this.base}/score`, request);
  }
}
