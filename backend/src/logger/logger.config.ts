import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

export const createLoggerConfig = (configService: ConfigService) => {
  const logLevel = configService.get('logLevel') || 'info';
  const logDir = path.join(process.cwd(), 'logs');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
      const contextStr = context ? `[${context}] ` : '';
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} ${level}: ${contextStr}${typeof message === 'object' ? JSON.stringify(message) : message} ${metaStr}`;
    }),
  );

  return {
    level: logLevel,
    format: logFormat,
    defaultMeta: {
      service: 'employee-hierarchy-api',
      environment: configService.get('NODE_ENV') || 'development',
    },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: logFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
      }),
    ],
  };
};
