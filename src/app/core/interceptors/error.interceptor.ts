import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, throwError } from 'rxjs';

import {
  FORBIDDEN_FALLBACK_ROUTE,
  SUPPRESS_FORBIDDEN_REDIRECT,
  SUPPRESS_GLOBAL_ERROR_TOAST
} from './http-context.tokens';
import { ApiError, IStandardResponse, OperationResult } from '../models/api-response.model';
import { ToastService } from '../services/toast.service';

const SUCCESS_RESULTS = new Set<OperationResult>([
  OperationResult.Ok,
  OperationResult.Created,
  OperationResult.Updated,
  OperationResult.Deleted
]);

const NON_REDIRECT_403_ERRORS = new Set(['MaxUsersLimitReached', 'NoActiveTenant']);
const MACHINE_ERROR_CODE_REGEX = /^[A-Z][A-Za-z0-9_]*$/;

const ERROR_CODE_MESSAGES: Record<string, string> = {
  DuplicateName: 'ERROR_CODES.DUPLICATE_NAME',
  InvalidOib: 'ERROR_CODES.INVALID_OIB',
  OibChangeNotAllowed: 'ERROR_CODES.OIB_CHANGE_NOT_ALLOWED',
  FolderDepthLimitExceeded: 'ERROR_CODES.FOLDER_DEPTH_LIMIT_EXCEEDED',
  InvalidParentFolder: 'ERROR_CODES.INVALID_PARENT_FOLDER',
  ALREADY_OWNER: 'ERROR_CODES.ALREADY_OWNER',
  LOCKED_BY_OTHER: 'ERROR_CODES.LOCKED_BY_OTHER',
  NOT_ALLOWED: 'ERROR_CODES.NOT_ALLOWED',
  MISSING_REQUIRED_CUSTOM_FIELD_VALUES: 'ERROR_CODES.MISSING_REQUIRED_CUSTOM_FIELD_VALUES'
};

export function isHandledApiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const code = getApiErrorCode(error);
    return !!(code && ERROR_CODE_MESSAGES[code]);
  }

  if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
    const code = getHttpErrorCode(error);
    return !!(code && ERROR_CODE_MESSAGES[code]) || !!getHttpReadableMessage(error);
  }

  return false;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/assets/i18n/')) {
    return next(req);
  }

  const toastService = inject(ToastService);
  const injector = inject(Injector);

  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && isStandardResponse(event.body) && !isSuccessfulResult(event.body.result)) {
        throw new ApiError(
          event.body.message || 'ERRORS.APP_ERROR',
          event.body.result,
          event.body.error
        );
      }

      return event;
    }),
    catchError((error: unknown) => {
      const errorMessage = getErrorMessage(error, req.context.get(SUPPRESS_FORBIDDEN_REDIRECT), injector, req.context.get(FORBIDDEN_FALLBACK_ROUTE));

      if (errorMessage && !req.context.get(SUPPRESS_GLOBAL_ERROR_TOAST)) {
        toastService.error(errorMessage);
      }

      return throwError(() => error);
    })
  );
};

function getErrorMessage(
  error: unknown,
  suppressForbiddenRedirect: boolean,
  injector: Injector,
  forbiddenFallbackRoute: string[] | null
): string {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error, suppressForbiddenRedirect, injector, forbiddenFallbackRoute);
  }

  if (error instanceof HttpErrorResponse) {
    return getHttpErrorMessage(error, suppressForbiddenRedirect, injector, forbiddenFallbackRoute);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'ERRORS.UNKNOWN';
}

function getApiErrorMessage(
  error: ApiError,
  suppressForbiddenRedirect: boolean,
  injector: Injector,
  forbiddenFallbackRoute: string[] | null
): string {
  const code = getApiErrorCode(error);
  const mappedMessage = code ? ERROR_CODE_MESSAGES[code] : undefined;
  const readableDetails = getReadableText(error.errorDetails);

  switch (error.result) {
    case OperationResult.BadRequest:
      return mappedMessage || readableDetails || error.message || 'ERRORS.BAD_REQUEST';
    case OperationResult.NotFound:
      return mappedMessage || readableDetails || error.message || 'ERRORS.NOT_FOUND';
    case OperationResult.Conflict:
      return mappedMessage || readableDetails || error.message || 'ERRORS.CONFLICT';
    case OperationResult.Unauthorized:
      return 'ERRORS.UNAUTHORIZED';
    case OperationResult.Forbidden:
      handleForbiddenRedirect(code, suppressForbiddenRedirect, injector, forbiddenFallbackRoute);
      return mappedMessage || readableDetails || error.message || 'ERRORS.FORBIDDEN';
    case OperationResult.InternalError:
      return mappedMessage || readableDetails || error.message || 'ERRORS.APP_ERROR';
    default:
      return mappedMessage || readableDetails || error.message || 'ERRORS.UNKNOWN';
  }
}

function getHttpErrorMessage(
  error: HttpErrorResponse,
  suppressForbiddenRedirect: boolean,
  injector: Injector,
  forbiddenFallbackRoute: string[] | null
): string {
  const code = getHttpErrorCode(error);
  const mappedMessage = code ? ERROR_CODE_MESSAGES[code] : undefined;
  const readableMessage = getHttpReadableMessage(error);

  switch (error.status) {
    case 400:
      return mappedMessage || readableMessage || 'ERRORS.BAD_REQUEST';
    case 401:
      return 'ERRORS.HTTP_401';
    case 403:
      handleForbiddenRedirect(code, suppressForbiddenRedirect, injector, forbiddenFallbackRoute);
      return mappedMessage || readableMessage || 'ERRORS.HTTP_403';
    case 404:
      return mappedMessage || readableMessage || 'ERRORS.HTTP_404';
    case 409:
      return mappedMessage || readableMessage || 'ERRORS.CONFLICT';
    case 500:
      return mappedMessage || readableMessage || 'ERRORS.HTTP_500';
    case 0:
      return 'ERRORS.NO_CONNECTION';
    default:
      return mappedMessage || readableMessage || `HTTP Error: ${error.status} ${error.statusText}`;
  }
}

function handleForbiddenRedirect(
  code: string | null,
  suppressForbiddenRedirect: boolean,
  injector: Injector,
  forbiddenFallbackRoute: string[] | null
): void {
  if (suppressForbiddenRedirect || NON_REDIRECT_403_ERRORS.has(code || '') || !forbiddenFallbackRoute) {
    return;
  }

  injector.get(Router).navigate(forbiddenFallbackRoute);
}

function getApiErrorCode(error: ApiError): string | null {
  if (typeof error.errorDetails === 'string') {
    return error.errorDetails;
  }

  if (isRecord(error.errorDetails) && typeof error.errorDetails['error'] === 'string') {
    return error.errorDetails['error'];
  }

  return isMachineErrorCode(error.message) ? error.message : null;
}

function getHttpErrorCode(error: HttpErrorResponse): string | null {
  const body = error.error;

  if (isRecord(body)) {
    if (typeof body['error'] === 'string' && isMachineErrorCode(body['error'])) {
      return body['error'];
    }

    if (typeof body['message'] === 'string' && isMachineErrorCode(body['message'])) {
      return body['message'];
    }

    if (typeof body['result'] === 'string' && isMachineErrorCode(body['result'])) {
      return body['result'];
    }
  }

  return typeof body === 'string' && isMachineErrorCode(body) ? body : null;
}

function getHttpReadableMessage(error: HttpErrorResponse): string {
  const body = error.error;

  if (typeof body === 'string') {
    return isMachineErrorCode(body) ? '' : body;
  }

  if (!isRecord(body)) {
    return '';
  }

  const message = body['message'];
  if (typeof message === 'string' && !isMachineErrorCode(message)) {
    return message;
  }

  const errorValue = body['error'];
  if (typeof errorValue === 'string' && !isMachineErrorCode(errorValue)) {
    return errorValue;
  }

  return '';
}

function getReadableText(value: unknown): string {
  return typeof value === 'string' && !isMachineErrorCode(value) ? value : '';
}

function isStandardResponse(body: unknown): body is IStandardResponse {
  return isRecord(body)
    && typeof body['result'] === 'string'
    && Object.values(OperationResult).includes(body['result'] as OperationResult);
}

function isSuccessfulResult(result: OperationResult): boolean {
  return SUCCESS_RESULTS.has(result);
}

function isMachineErrorCode(value: string): boolean {
  return MACHINE_ERROR_CODE_REGEX.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
