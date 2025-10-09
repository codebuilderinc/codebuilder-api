// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://ddb767c749d4c40c6a83bd1ec1750ded@o1347126.ingest.us.sentry.io/4510154827366400',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});

//
// ===================================
// OpenTelemetry Initialization
// ===================================
//
// The OpenTelemetry SDK must be initialized BEFORE any other modules are imported.
// This ensures that instrumentation can correctly patch the necessary libraries
// and capture telemetry from the very beginning of the application's lifecycle.
//
//import { NodeSDK } from '@opentelemetry/sdk-node';
//import openTelemetryConfig from './open-telemetry.config.json'; // Assuming this config file exists in your new project

// const openTelemetry = new NodeSDK(openTelemetryConfig);

// try {
//     openTelemetry.start();
//     console.log('✅ OpenTelemetry SDK started successfully.');
// } catch (error) {
//     console.error('❌ Could not start OpenTelemetry SDK:', error);
//     process.exit(1);
// }

// // Gracefully shut down the OpenTelemetry SDK on process exit.
// process.on('SIGTERM', () => {
//     openTelemetry
//         .shutdown()
//         .then(() => console.log('➡️ OpenTelemetry tracing terminated.'))
//         .catch((error) => console.error('Error terminating OpenTelemetry tracing:', error))
//         .finally(() => process.exit(0));
// });
