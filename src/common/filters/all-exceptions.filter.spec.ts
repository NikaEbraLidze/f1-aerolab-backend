import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ApiError } from '../interfaces/api-response.interface';

function buildHost(url = '/test', method = 'GET') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { url, method };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
  });

  it('maps NotFoundException to 404 envelope', () => {
    const { host, status, json } = buildHost('/presets/abc');
    filter.catch(new NotFoundException('Preset not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = json.mock.calls[0][0] as ApiError;
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Preset not found');
    expect(body.error.details).toBeNull();
    expect(body.path).toBe('/presets/abc');
  });

  it('maps ConflictException to 409 envelope', () => {
    const { host, status, json } = buildHost();
    filter.catch(new ConflictException('Duplicate'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const body = json.mock.calls[0][0] as ApiError;
    expect(body.error.code).toBe('CONFLICT');
  });

  it('maps validation BadRequestException to VALIDATION_ERROR with details', () => {
    const { host, status, json } = buildHost('/presets', 'POST');
    const exception = new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: [
        'name should not be empty',
        'speed must not be less than 0',
        'speed must be a number conforming to the specified constraints',
      ],
    });
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = json.mock.calls[0][0] as ApiError;
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).not.toBeNull();
    const fields = body.error.details!.map((d) => d.field).sort();
    expect(fields).toEqual(['name', 'speed']);
  });

  it('maps generic BadRequestException (string) to BAD_REQUEST', () => {
    const { host, status, json } = buildHost();
    filter.catch(new BadRequestException('Bad input'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = json.mock.calls[0][0] as ApiError;
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe('Bad input');
    expect(body.error.details).toBeNull();
  });

  it('maps Prisma P2025 to 404 NOT_FOUND', () => {
    const { host, status, json } = buildHost();
    const error = new Prisma.PrismaClientKnownRequestError(
      'Record to delete does not exist.',
      { code: 'P2025', clientVersion: '5.0.0' },
    );
    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = json.mock.calls[0][0] as ApiError;
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('maps Prisma P2002 to 409 CONFLICT', () => {
    const { host, status, json } = buildHost();
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed.',
      { code: 'P2002', clientVersion: '5.0.0' },
    );
    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const body = json.mock.calls[0][0] as ApiError;
    expect(body.error.code).toBe('CONFLICT');
  });

  it('maps unknown errors to 500 INTERNAL_ERROR without leaking detail', () => {
    const { host, status, json } = buildHost();
    filter.catch(new Error('secret database string'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = json.mock.calls[0][0] as ApiError;
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.message).not.toContain('secret');
  });

  it('preserves custom HttpException status', () => {
    const { host, status } = buildHost();
    filter.catch(new HttpException('Teapot', HttpStatus.I_AM_A_TEAPOT), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.I_AM_A_TEAPOT);
  });
});
