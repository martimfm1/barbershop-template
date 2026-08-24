type LogContext = Record<string, unknown>;

function sanitize(context: LogContext): LogContext {
  const blocked = new Set([
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'authorization',
    'code',
    'qrPayload',
    'email',
  ]);
  return Object.fromEntries(
    Object.entries(context).filter(([key]) => !blocked.has(key)),
  );
}

function write(
  level: 'info' | 'warn' | 'error',
  event: string,
  context: LogContext = {},
) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    env: process.env.NODE_ENV,
    ...sanitize(context),
  };

  if (level === 'error') console.error('[SILENTRA]', payload);
  else if (level === 'warn') console.warn('[SILENTRA]', payload);
  else console.info('[SILENTRA]', payload);
}

export const productionLogger = {
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, context?: LogContext) =>
    write('error', event, context),
};
