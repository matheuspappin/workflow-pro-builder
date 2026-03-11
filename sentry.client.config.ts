import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Em produção usar 0.05-0.1 (5-10%) para não exceder cota do plano Sentry
  // Em desenvolvimento/staging pode usar 1.0
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Replay: gravar apenas sessões com erros
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],

  debug: false,
});
