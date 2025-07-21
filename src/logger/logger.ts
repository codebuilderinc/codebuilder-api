import Pino, { Logger } from 'pino';
import { LoggerOptions, destination } from 'pino';
import { trace, context } from '@opentelemetry/api';
import { colorizerFactory, prettyFactory } from 'pino-pretty';
const levelColorize = colorizerFactory(true);

export const loggerOptions: LoggerOptions = {
    level: 'info',
    formatters: {
        level(label) {
            return { level: label };
        },
        // Workaround for PinoInstrumentation (does not support latest version yet)
        log(object) {
            const span = trace.getSpan(context.active());
            if (!span) return { ...object };
            let spanId = '';
            let traceId = '';
            const spanContext = trace.getSpan(context.active())?.spanContext();
            if (spanContext) {
                ({ spanId, traceId } = spanContext);
            }
            return { ...object, spanId, traceId };
        },
    },
    //prettifier: process.env.NODE_ENV === 'local' ? require('pino-pretty') : false,
    transport: {
        target: 'pino-pretty',
        options: {
            autoLogging: false,
            //colorize: true,
            customPrettifiers: {
                // The argument for this function will be the same
                // string that's at the start of the log-line by default:
                /*  time: (timestamp) => `🕰 ${timestamp}`,

        // The argument for the level-prettifier may vary depending
        // on if the levelKey option is used or not.
        // By default this will be the same numerics as the Pino default:
        level: (logLevel) => `LEVEL: ${levelColorize(logLevel)}`,

        // other prettifiers can be used for the other keys if needed, for example
        hostname: (hostname) => hostname, //colorGreen(hostname),
        pid: (pid) => pid, ///colorRed(pid),
        name: (name) => name, //colorBlue(name),
        caller: (caller) => caller, //colorCyan(caller),*/
            },
        },
    },
};

export const logger: Logger = Pino(loggerOptions, Pino.destination());
