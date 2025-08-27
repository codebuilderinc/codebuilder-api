// Colored console logger matching the user's Next.js style

/** ANSI color codes for console output */
const colors = {
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

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${colors.blue}[INFO]${colors.reset} ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.log(`${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
      console.log(`${colors.gray}[DEBUG]${colors.reset} ${message}`, ...args);
    }
  },
};

export type AppLogger = typeof logger;
export { colors };
