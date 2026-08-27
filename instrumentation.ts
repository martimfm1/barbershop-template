import { productionLogger } from '@/lib/observability/logger';

let handlersRegistered = false;

export async function register() {
  if (process.env.NODE_ENV !== 'production' || handlersRegistered) return;
  handlersRegistered = true;

  process.on('uncaughtException', (error) => {
    productionLogger.exception('server.uncaught_exception', error);
  });

  process.on('unhandledRejection', (reason) => {
    productionLogger.exception('server.unhandled_rejection', reason);
  });

  const noop = () => undefined;
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}
