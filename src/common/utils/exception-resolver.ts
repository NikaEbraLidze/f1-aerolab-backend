import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ErrorCode,
  ValidationErrorDetail,
} from '../interfaces/api-response.interface';

export interface ResolvedError {
  status: number;
  code: ErrorCode;
  message: string;
  details: ValidationErrorDetail[] | null;
}

export function resolveException(exception: unknown): ResolvedError {
  if (exception instanceof HttpException) {
    return fromHttpException(exception);
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    return fromPrismaKnown(exception);
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    details: null,
  };
}

function fromHttpException(exception: HttpException): ResolvedError {
  const status = exception.getStatus();
  const payload = exception.getResponse();

  const details = extractValidationDetails(payload);
  const code: ErrorCode = details
    ? 'VALIDATION_ERROR'
    : statusToCode(status);

  const message =
    typeof payload === 'string'
      ? payload
      : ((payload as { message?: string | string[] })?.message as string) ||
        exception.message;

  return {
    status,
    code,
    message: Array.isArray(message) ? message.join('; ') : message,
    details,
  };
}

function fromPrismaKnown(
  exception: Prisma.PrismaClientKnownRequestError,
): ResolvedError {
  switch (exception.code) {
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        message: 'Record not found',
        details: null,
      };
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'Resource already exists',
        details: null,
      };
    default:
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'BAD_REQUEST',
        message: 'Database request error',
        details: null,
      };
  }
}

function extractValidationDetails(
  payload: string | object,
): ValidationErrorDetail[] | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const messages = (payload as { message?: unknown }).message;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const byField = new Map<string, string[]>();
  for (const raw of messages) {
    if (typeof raw !== 'string') continue;
    const field = raw.split(' ')[0] ?? 'unknown';
    const existing = byField.get(field) ?? [];
    existing.push(raw);
    byField.set(field, existing);
  }

  return Array.from(byField.entries()).map(([field, constraints]) => ({
    field,
    constraints,
  }));
}

function statusToCode(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  }
}
