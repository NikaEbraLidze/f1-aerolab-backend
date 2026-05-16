import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function mockContext(url: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

function mockHandler<T>(value: T): CallHandler<T> {
  return { handle: () => of(value) };
}

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('wraps data in success envelope', async () => {
    const data = { foo: 'bar' };
    const result = await lastValueFrom(
      interceptor.intercept(mockContext('/health'), mockHandler(data)),
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
    expect(result.path).toBe('/health');
    expect(typeof result.timestamp).toBe('string');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('wraps array data unchanged', async () => {
    const arr = [1, 2, 3];
    const result = await lastValueFrom(
      interceptor.intercept(mockContext('/presets'), mockHandler(arr)),
    );

    expect(result.data).toEqual(arr);
  });

  it('wraps null data', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext('/x'), mockHandler(null)),
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});
