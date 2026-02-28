/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // Removido ignoreBuildErrors para garantir qualidade do código
  // Removido serverExternalPackages pois removemos a dependência direta do pino
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
