// Shared color and formatting utilities for logger
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

export function colorize(level: string, text: string): string {
  switch (level) {
    case 'info':
      return `${colors.blue}[INFO]${colors.reset} ${text}`;
    case 'warn':
      return `${colors.yellow}[WARN]${colors.reset} ${text}`;
    case 'error':
      return `${colors.red}[ERROR]${colors.reset} ${text}`;
    case 'success':
      return `${colors.green}[SUCCESS]${colors.reset} ${text}`;
    case 'debug':
      return `${colors.gray}[DEBUG]${colors.reset} ${text}`;
    default:
      return text;
  }
}

export function formatLog(level: string, message: string, context?: string, ...args: any[]): [string, ...any[]] {
  const now = new Date().toISOString();
  const ctx = context ? `${colors.magenta}[${context}]${colors.reset} ` : '';
  return [`${colors.gray}[${now}]${colors.reset} ${colorize(level, ctx + message)}`, ...args];
}
