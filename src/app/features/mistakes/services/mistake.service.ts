import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { CreateMistakeRequest, Mistake, UpdateMistakeRequest } from '../models/mistake.model';

@Injectable({ providedIn: 'root' })
export class MistakeService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Mistake[]> {
    return this.api.get<Mistake[]>('mistakes');
  }

  getById(mistakeId: string): Observable<Mistake> {
    return this.api.get<Mistake>(`mistakes/${mistakeId}`);
  }

  create(request: CreateMistakeRequest): Observable<Mistake> {
    return this.api.post<Mistake>('mistakes', request);
  }

  update(mistakeId: string, request: UpdateMistakeRequest): Observable<Mistake> {
    return this.api.put<Mistake>(`mistakes/${mistakeId}`, request);
  }

  delete(mistakeId: string): Observable<object> {
    return this.api.delete<object>(`mistakes/${mistakeId}`);
  }
}
