export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface ValidationErrorDetail {
  field: string;
  constraints: string[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details: ValidationErrorDetail[] | null;
  };
  timestamp: string;
  path: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
