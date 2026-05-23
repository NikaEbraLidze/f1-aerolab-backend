import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { resolveException } from '../utils/exception-resolver';
import { toWsErrorEvent } from '../utils/ws-error.util';

@Catch()
export class WsExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionsFilter.name);

  constructor(private readonly errorEvent: string) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'ws') {
      return;
    }

    const resolved = resolveException(exception);

    if (resolved.status >= 500) {
      this.logger.error(
        `Unhandled WebSocket error on ${this.errorEvent}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    return toWsErrorEvent(this.errorEvent, resolved);
  }
}
