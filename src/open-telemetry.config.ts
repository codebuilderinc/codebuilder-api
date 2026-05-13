// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
// import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
// import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
// import { Resource } from '@opentelemetry/resources';
// //import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
// //import { NodeSDKConfiguration } from '@opentelemetry/sdk-node';
// import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
// import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
// import os from 'os';
// import { loadConfig } from './common/configs/config.helper';
// import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
// //import { OpenTelemetryModuleConfig } from '@metinseylan/nestjs-opentelemetry';

// const APP_CONFIG = loadConfig();

// const config: Partial<any> = {
//     resource: new Resource({
//         [SemanticResourceAttributes.SERVICE_NAME]: 'sss',
//         [SemanticResourceAttributes.SERVICE_VERSION]: APP_CONFIG['SERVICE_VERSION'],
//         [SemanticResourceAttributes.HOST_NAME]: process.env.HOSTNAME || os.hostname(),
//     }) as any,
//     autoDetectResources: false,

//     textMapPropagator: new B3Propagator({
//         injectEncoding: B3InjectEncoding.MULTI_HEADER,
//     }),

//     instrumentations: [
//         getNodeAutoInstrumentations({
//             // We use `@metinseylan/nestjs-opentelemetry` instead, because it has better auto instrumentation
//             '@opentelemetry/instrumentation-nestjs-core': { enabled: false },

//             // We use a custom instrumentation in LogService instead, because the auto instrumentation
//             // only injects the trace and span id but does not trigger span events
//             '@opentelemetry/instrumentation-winston': { enabled: false },
//         }),
//     ],
// };

// /*
// const config: Partial<NodeSDKConfiguration> = {
//   resource: new Resource({
//     [SemanticResourceAttributes.SERVICE_NAME]: 'sss',
//     [SemanticResourceAttributes.SERVICE_VERSION]: APP_CONFIG['SERVICE_VERSION'],
//     [SemanticResourceAttributes.HOST_NAME]:
//       process.env.HOSTNAME || os.hostname(),
//   }) as any,
//   autoDetectResources: false,

//   textMapPropagator: new B3Propagator({
//     injectEncoding: B3InjectEncoding.MULTI_HEADER,
//   }),

//   instrumentations: [
//     getNodeAutoInstrumentations({
//       // We use `@metinseylan/nestjs-opentelemetry` instead, because it has better auto instrumentation
//       '@opentelemetry/instrumentation-nestjs-core': { enabled: false },

//       // We use a custom instrumentation in LogService instead, because the auto instrumentation
//       // only injects the trace and span id but does not trigger span events
//       '@opentelemetry/instrumentation-winston': { enabled: false },
//     }),
//   ],
// };*/

// // Export to local Zipkin instance for trace analysis in development
// if (APP_CONFIG['OPEN_TELEMETRY_ZIPKIN_ENABLED'] && !APP_CONFIG['OPEN_TELEMETRY_COLLECTOR_URL']) {
//     config.spanProcessor = new SimpleSpanProcessor(
//         new ZipkinExporter({
//             url: 'http://localhost:9411/api/v2/spans',
//         })
//     );
// }

// // Export to local Prometheus instance for metrics analysis in development
// if (APP_CONFIG['OPEN_TELEMETRY_PROMETHEUS_ENABLED'] && !APP_CONFIG['OPEN_TELEMETRY_LIGHTSTEP_ACCESS_TOKEN']) {
//     config.metricReader = new PrometheusExporter({
//         endpoint: 'metrics',
//         port: 9464,
//     });
// }

// // Export to Collector gateway for trace and metrics analysis in production
// if (APP_CONFIG['OPEN_TELEMETRY_COLLECTOR_URL']) {
//     config.traceExporter = new OTLPTraceExporter({
//         url: APP_CONFIG['OPEN_TELEMETRY_COLLECTOR_URL'] + '/v1/traces',
//     });

//     // TODO Re-enable metrics pipeline once the Node SDK supports the Collector format,
//     // and remove Lightstep exporter below.
//     // https://github.com/open-telemetry/opentelemetry-js/issues/2774
//     const collectorOptions = {
//         url: APP_CONFIG['OPEN_TELEMETRY_COLLECTOR_URL'] + '/v1/metrics', // url is optional and can be omitted - default is http://localhost:4317/v1/metrics
//         concurrencyLimit: 1, // an optional limit on pending requests
//     };
//     const metricExporter = new OTLPMetricExporter(collectorOptions);

//     const meterProvider = new MeterProvider();

//     meterProvider.addReader(
//       new PeriodicExportingMetricReader({
//         exporter: metricExporter,
//       })
//     );
// }

// // Export to Lightstep for metrics analysis in production
// if (APP_CONFIG['OPEN_TELEMETRY_LIGHTSTEP_ACCESS_TOKEN']) {
//     const collectorOptions = {
//         url: 'https://ingest.lightstep.com/metrics/otlp/v0.6',
//         headers: {
//             'Lightstep-Access-Token': APP_CONFIG['OPEN_TELEMETRY_LIGHTSTEP_ACCESS_TOKEN'],
//         },
//         concurrencyLimit: 1, // an optional limit on pending requests
//     };
//     const metricExporter = new OTLPMetricExporter(collectorOptions);

//     const meterProvider = new MeterProvider();

//     meterProvider.addReader(
//       new PeriodicExportingMetricReader({
//         exporter: metricExporter,
//         exportIntervalMillis: 60 * 1000,
//       })
//     );
// }

// export const openTelemetryConfig = config;
