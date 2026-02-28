import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Capture Replay for sessions where errors occur
  replaysSessionSampleRate: 0.1,

  // If you're not already sampling the entire session, change the sample rate to 100%
  // when an error happens for the session
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  debug: false,
  // Set `_exposeReplay` to true to allow inspecting the Replay in devtools. (DO NOT USE IN PRODUCTION)
  _experiments: { 
    _exposeReplay: process.env.NODE_ENV !== 'production',
  }
});
