import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiError,
  IStandardResponse,
  OperationResult,
  StandardListResponse,
  StandardResponse
} from '../models/api-response.model';
import { QueryBuilder } from '../utils/query-builder';

type ApiParamValue = string | number | boolean | ReadonlyArray<string | number | boolean> | null | undefined;
type ApiParams = HttpParams | QueryBuilder | Record<string, ApiParamValue>;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/v1`;

  get<T>(path: string, params?: ApiParams, context?: HttpContext): Observable<T> {
    return this.http
      .get<StandardResponse<T>>(this.url(path), { params: this.toHttpParams(params), context })
      .pipe(map(response => this.handleResponse(response)));
  }

  post<T>(path: string, body: unknown, context?: HttpContext): Observable<T> {
    return this.http
      .post<StandardResponse<T>>(this.url(path), body, { context })
      .pipe(map(response => this.handleResponse(response)));
  }

  put<T>(path: string, body: unknown, context?: HttpContext): Observable<T> {
    return this.http
      .put<StandardResponse<T>>(this.url(path), body, { context })
      .pipe(map(response => this.handleResponse(response)));
  }

  patch<T>(path: string, body: unknown, context?: HttpContext): Observable<T> {
    return this.http
      .patch<StandardResponse<T>>(this.url(path), body, { context })
      .pipe(map(response => this.handleResponse(response)));
  }

  delete<T>(path: string, params?: ApiParams, context?: HttpContext): Observable<T> {
    return this.http
      .delete<StandardResponse<T>>(this.url(path), { params: this.toHttpParams(params), context })
      .pipe(map(response => this.handleResponse(response)));
  }

  getGrid<T>(path: string, params?: ApiParams, context?: HttpContext): Observable<StandardListResponse<T>> {
    return this.http
      .get<StandardListResponse<T>>(this.url(path), { params: this.toHttpParams(params), context })
      .pipe(map(response => this.handleListResponse(response)));
  }

  getBlob(path: string, params?: ApiParams, context?: HttpContext): Observable<Blob> {
    return this.http.get(this.url(path), {
      params: this.toHttpParams(params),
      context,
      responseType: 'blob'
    });
  }

  private handleResponse<T>(response: StandardResponse<T>): T {
    this.validateResult(response);
    return response.model as T;
  }

  private handleListResponse<T>(response: StandardListResponse<T>): StandardListResponse<T> {
    this.validateResult(response);
    return response;
  }

  private validateResult(response: IStandardResponse): void {
    if (!this.isSuccessfulResult(response.result)) {
      throw new ApiError(
        response.message || 'ERRORS.APP_ERROR',
        response.result,
        response.error
      );
    }
  }

  private isSuccessfulResult(result: OperationResult): boolean {
    return [
      OperationResult.Ok,
      OperationResult.Created,
      OperationResult.Updated,
      OperationResult.Deleted
    ].includes(result);
  }

  private toHttpParams(params?: ApiParams): HttpParams {
    if (!params) {
      return new HttpParams();
    }

    if (params instanceof HttpParams) {
      return params;
    }

    if (params instanceof QueryBuilder) {
      return params.build();
    }

    return this.createParams(params);
  }

  private createParams(params: Record<string, ApiParamValue>): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (isApiParamArray(value)) {
        value.forEach(item => {
          httpParams = httpParams.append(key, item);
        });
        return;
      }

      httpParams = httpParams.append(key, value);
    });

    return httpParams;
  }

  private url(path: string): string {
    return `${this.apiUrl}/${path.replace(/^\/+/, '')}`;
  }
}

function isApiParamArray(value: ApiParamValue): value is ReadonlyArray<string | number | boolean> {
  return Array.isArray(value);
}
