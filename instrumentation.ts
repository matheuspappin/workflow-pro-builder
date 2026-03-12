/**
 * Next.js Instrumentation Hook — OpenTelemetry
 *
 * Ativa tracing distribuído para todas as rotas de API.
 * Integrado com Vercel Observability (traces disponíveis em Dashboard → Observability → Traces).
 *
 * Para exportar para Sentry/Datadog/Grafana, defina:
 *   OTEL_EXPORTER_OTLP_ENDPOINT=https://...
 *   OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer ...
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http')
    // v2.x usa resourceFromAttributes em vez de new Resource()
    const { resourceFromAttributes } = await import('@opentelemetry/resources')
    const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions')

    const exporterHeaders: Record<string, string> = {}
    if (process.env.OTEL_EXPORTER_OTLP_HEADERS) {
      for (const header of process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',')) {
        const [key, ...rest] = header.split('=')
        if (key && rest.length) exporterHeaders[key.trim()] = rest.join('=').trim()
      }
    }

    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'https://otel.vercel.com/v1/traces',
      headers: exporterHeaders,
    })

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'akaai-workflow-pro',
        'service.version': process.env.npm_package_version ?? '1.0.0',
      }),
      traceExporter: exporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // fs instrumentation é muito verbosa em dev
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-http': { enabled: true },
          '@opentelemetry/instrumentation-pg': { enabled: true },
        }),
      ],
    })

    sdk.start()
  }
}
