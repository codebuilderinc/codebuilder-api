import type { Request, Response, NextFunction } from 'express';
import { colors } from './logger';

// Common noise paths that shouldn't produce logs
const IGNORED_PATHS = new Set<string>([
  '/favicon.ico',
  '/robots.txt',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/site.webmanifest',
  '/sitemap.xml',
]);

function isIgnoredPath(urlOrPath: string): boolean {
  const path = (urlOrPath || '').split('?')[0];
  if (!path) return false;
  if (IGNORED_PATHS.has(path)) return true;
  // Also ignore well-known browser icon probes
  if (path.startsWith('/favicon')) return true;
  return false;
}

function getColoredStatus(status: number): string {
  let color: string = colors.gray;
  if (status >= 200 && status < 300) color = colors.green;
  else if (status >= 300 && status < 400) color = colors.yellow;
  else if (status >= 400 && status < 500) color = colors.red;
  else if (status >= 500) color = colors.red + colors.bright;
  return `${color}${status}${colors.reset}`;
}

function getColoredMethod(method: string): string {
  const methodColors: Record<string, string> = {
    GET: colors.green,
    POST: colors.blue,
    PUT: colors.yellow,
    DELETE: colors.red,
    PATCH: colors.magenta,
    HEAD: colors.cyan,
    OPTIONS: colors.gray,
  };
  const color = methodColors[method] || colors.white;
  return `${color}${method.padEnd(7)}${colors.reset}`;
}

function getColoredDuration(ms: number): string {
  let color: string = colors.green;
  if (ms > 1000) color = colors.red;
  else if (ms > 500) color = colors.yellow;
  else if (ms > 100) color = colors.cyan;
  return `${color}${ms.toFixed(0)}ms${colors.reset}`;
}

function getClientIP(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];

  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  if (typeof xRealIP === 'string') return xRealIP;
  if (typeof cfConnectingIP === 'string') return cfConnectingIP;
  const ip = (req.ip || req.socket.remoteAddress || '').toString();
  return ip || 'unknown';
}

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const clientIP = getClientIP(req);

  // Skip logging for ignored paths
  if (isIgnoredPath(url)) {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const timestamp = new Date().toISOString();
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ` +
        `${getColoredMethod(method)} ` +
        `${colors.cyan}${url}${colors.reset} ` +
        `${getColoredStatus(status)} ` +
        `${getColoredDuration(duration)} ` +
        `${colors.gray}from ${clientIP}${colors.reset}`
    );
  });

  next();
}
