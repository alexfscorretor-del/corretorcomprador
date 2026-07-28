type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogPayload = {
  level: LogLevel;
  message: string;
  scope?: string;
  error?: unknown;
  meta?: Record<string, unknown>;
  ts: string;
};

function emit(payload: LogPayload): void {
  const line = {
    ...payload,
    error:
      payload.error instanceof Error
        ? {
            name: payload.error.name,
            message: payload.error.message,
            stack:
              process.env.NODE_ENV === 'production'
                ? undefined
                : payload.error.stack,
          }
        : payload.error,
  };

  const text = `[${payload.level}]${payload.scope ? ` (${payload.scope})` : ''} ${payload.message}`;

  if (payload.level === 'error') {
    console.error(text, line);
  } else if (payload.level === 'warn') {
    console.warn(text, line);
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(text, line);
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>, scope?: string) {
    emit({ level: 'debug', message, meta, scope, ts: new Date().toISOString() });
  },
  info(message: string, meta?: Record<string, unknown>, scope?: string) {
    emit({ level: 'info', message, meta, scope, ts: new Date().toISOString() });
  },
  warn(message: string, meta?: Record<string, unknown>, scope?: string) {
    emit({ level: 'warn', message, meta, scope, ts: new Date().toISOString() });
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>, scope?: string) {
    emit({
      level: 'error',
      message,
      error,
      meta,
      scope,
      ts: new Date().toISOString(),
    });
  },
};
