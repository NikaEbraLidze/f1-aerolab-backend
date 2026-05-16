import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import {
  ApiError,
  ErrorCode,
  ValidationErrorDetail,
} from '../interfaces/api-response.interface';

interface ResolvedError {
  status: number;
  code: ErrorCode;
  message: string;
  details: ValidationErrorDetail[] | null;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = this.resolve(exception);

    if (resolved.status >= 500) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiError = {
      success: false,
      error: {
        code: resolved.code,
        message: resolved.message,
        details: resolved.details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(resolved.status).json(body);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaKnown(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: null,
    };
  }

  private fromHttpException(exception: HttpException): ResolvedError {
    const status = exception.getStatus();
    const payload = exception.getResponse();

    const details = this.extractValidationDetails(payload);
    const code: ErrorCode = details
      ? 'VALIDATION_ERROR'
      : this.statusToCode(status);

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

  private fromPrismaKnown(
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

  private extractValidationDetails(
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

  private statusToCode(status: number): ErrorCode {
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
}
