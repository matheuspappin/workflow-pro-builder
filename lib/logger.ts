import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  // O transporte 'pino-pretty' foi removido porque causa instabilidade (Error: the worker has exited)
  // em ambientes Next.js (especialmente no Windows com Turbopack) devido ao uso de worker_threads internos.
  // Para ver logs formatados, você pode usar a CLI: npm run dev | pino-pretty
});

export default logger;
