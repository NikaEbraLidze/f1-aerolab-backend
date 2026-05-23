import { ResolvedError } from './exception-resolver';

export function toWsErrorEvent(errorEvent: string, resolved: ResolvedError) {
  return {
    event: errorEvent,
    data: {
      code: resolved.code,
      message: resolved.message,
      details: resolved.details,
    },
  };
}
