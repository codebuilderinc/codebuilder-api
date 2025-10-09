import { Injectable, Inject, Optional } from '@nestjs/common';
import { formatLog, colors } from './colors';

/**
 * Injectable logger service for context-aware logging.
 * Usage: inject LoggerService and call .info(), .warn(), etc.
 */
@Injectable()
export class LoggerService {
  private context?: string;

  constructor(@Optional() @Inject('LOGGER_CONTEXT') context?: string) {
    if (context) this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  info(message: string, ...args: any[]) {
    console.log(...formatLog('info', message, this.context, ...args));
  }
  warn(message: string, ...args: any[]) {
    console.log(...formatLog('warn', message, this.context, ...args));
  }
  error(message: string, ...args: any[]) {
    console.log(...formatLog('error', message, this.context, ...args));
  }
  debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
      console.log(...formatLog('debug', message, this.context, ...args));
    }
  }
  success(message: string, ...args: any[]) {
    console.log(...formatLog('success', message, this.context, ...args));
  }

  // Expose colors for advanced use
  colors = colors;
}
