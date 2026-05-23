import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '../interfaces/api-response.interface';
import { resolveException } from '../utils/exception-resolver';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = resolveException(exception);

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
}
