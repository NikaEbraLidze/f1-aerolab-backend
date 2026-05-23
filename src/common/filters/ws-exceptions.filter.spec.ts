import {
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { WsExceptionsFilter } from './ws-exceptions.filter';

function buildWsHost() {
  const host = {
    getType: () => 'ws' as const,
    switchToWs: () => ({
      getClient: () => ({}),
      getData: () => ({}),
      getPattern: () => 'simulate:update',
    }),
  } as unknown as ArgumentsHost;
  return host;
}

describe('WsExceptionsFilter', () => {
  let filter: WsExceptionsFilter;

  beforeEach(() => {
    filter = new WsExceptionsFilter('simulate:error');
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
  });

  it('maps validation BadRequestException to enriched error payload', () => {
    const host = buildWsHost();
    const exception = new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: [
        'speed must not be greater than 400',
        'wingAngle must not be greater than 30',
      ],
    });

    const result = filter.catch(exception, host);

    expect(result).toEqual({
      event: 'simulate:error',
      data: {
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('speed'),
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'speed' }),
          expect.objectContaining({ field: 'wingAngle' }),
        ]),
      },
    });
  });

  it('maps generic BadRequestException to BAD_REQUEST', () => {
    const host = buildWsHost();
    const result = filter.catch(new BadRequestException('Bad input'), host);

    expect(result).toEqual({
      event: 'simulate:error',
      data: {
        code: 'BAD_REQUEST',
        message: 'Bad input',
        details: null,
      },
    });
  });

  it('sanitizes unknown errors to INTERNAL_ERROR without leaking detail', () => {
    const host = buildWsHost();
    const result = filter.catch(new Error('secret database string'), host);

    expect(result).toEqual({
      event: 'simulate:error',
      data: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: null,
      },
    });
    expect(result!.data.message).not.toContain('secret');
    expect(filter['logger'].error).toHaveBeenCalled();
  });

  it('returns undefined for non-ws context', () => {
    const host = {
      getType: () => 'http',
    } as unknown as ArgumentsHost;

    const result = filter.catch(new Error('fail'), host);

    expect(result).toBeUndefined();
  });

  it('uses configured error event name', () => {
    const customFilter = new WsExceptionsFilter('custom:error');
    const host = buildWsHost();

    const result = customFilter.catch(
      new BadRequestException('Bad input'),
      host,
    );

    expect(result?.event).toBe('custom:error');
  });
});
