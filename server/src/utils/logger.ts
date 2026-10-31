/*
 * logger.ts
 * Application-wide Winston logger — uses JSON format in production and
 * colorized simple format in development; also exports a maskSensitive
 * helper for redacting secrets in log messages.
 */
import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console({
      format:
        config.nodeEnv === 'development'
          ? combine(colorize(), simple())
          : combine(timestamp(), json()),
    }),
  ],
});

export function maskSensitive(value: string): string {
  if (!value || value.length <= 4) return '****';
  return value.slice(0, 2) + '****' + value.slice(-2);
}
