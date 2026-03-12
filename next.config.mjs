/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development'

// Content Security Policy — atualizar conforme novos domínios externos forem adicionados
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    // Sentry tunnel (definido em tunnelRoute)
    "'unsafe-inline'", // necessário para Next.js inline scripts — remover quando migrar para nonces
    'https://monitoring-tunnel',
    isDev ? "'unsafe-eval'" : '', // apenas dev (hot reload)
  ].filter(Boolean),
  'style-src': ["'self'", "'unsafe-inline'"], // inline styles do Tailwind
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://images.unsplash.com',
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    'https://*.supabase.co',
    'https://generativelanguage.googleapis.com',
    'https://sentry.io',
    'https://*.sentry.io',
    isDev ? 'ws://localhost:*' : '', // Next.js HMR
  ].filter(Boolean),
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': isDev ? [] : [''],
}

const cspHeader = Object.entries(cspDirectives)
  .map(([key, values]) => {
    if (values.length === 0) return key
    return `${key} ${values.join(' ')}`
  })
  .join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK during package build to avoid needing an extra step when
  // working with hardcoded dependencies (e.g. at the app level)
  transpileClientSDK: true,

  // Routes browser requests to an area where Sentry can load source maps to debug
  tunnelRoute: "/monitoring-tunnel",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  org: "my-org",
  project: "my-project",
}, {
  // For all available options, see: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Suppresses source map uploading logs during build
  silent: true,

  // For all available options, see: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
