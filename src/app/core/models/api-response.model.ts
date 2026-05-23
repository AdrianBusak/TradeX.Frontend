export enum OperationResult {
  Ok = 'Ok',
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  BadRequest = 'BadRequest',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  InternalError = 'InternalError'
}

export interface IStandardResponse {
  result: OperationResult;
  message?: string;
  error?: any;
}

export interface StandardResponse<T> extends IStandardResponse {
  model?: T;
}

export interface StandardListResponse<T> extends StandardResponse<T[]> {
  totalRecordCount: number;
  pageIndex: number;
  pageSize: number;
}

export class ApiError extends Error {
  constructor(
    public override message: string,
    public result: OperationResult,
    public errorDetails?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}