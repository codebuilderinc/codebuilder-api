import winston from 'winston';

export class ConsoleTransport extends winston.transports.Console {
  constructor() {
    const isNumber = (value: unknown): value is number => {
      return typeof value === 'number';
    };

    const prettyPrintFormat = winston.format.printf(({ context, level, timestamp, message, ...meta }) => {
      const hasMeta = Object.values(meta).filter(Boolean).length > 0;
      const status = (meta as any).statusCode;
      if (status !== undefined) {
        // remove statusCode from trailing meta since we surface it inline
        delete (meta as any).statusCode;
      }

      return [
        `[${new Date(isNumber(timestamp) ? timestamp : Date.now()).toLocaleString()}] `,
        `[${level}] `,
        status !== undefined ? `[status:${status}] ` : '',
        `${context === undefined || context === null ? 'Nest Core' : JSON.stringify(context)}] `,
        `${JSON.stringify(message)} `,
        hasMeta ? JSON.stringify(meta) : '',
      ].join('');
    });

    super({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({ level: true }),
        prettyPrintFormat
      ),
    });
  }
}
