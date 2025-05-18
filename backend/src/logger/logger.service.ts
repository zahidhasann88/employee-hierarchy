import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createLoggerConfig } from './logger.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.logger = winston.createLogger(createLoggerConfig(configService));
  }

  log(message: any, context?: string): void {
    this.writeLog('info', message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.writeLog('error', message, context, trace);
  }

  warn(message: any, context?: string): void {
    this.writeLog('warn', message, context);
  }

  debug(message: any, context?: string): void {
    this.writeLog('debug', message, context);
  }

  verbose(message: any, context?: string): void {
    this.writeLog('verbose', message, context);
  }

  private writeLog(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ): void {
    const logMessage = typeof message === 'object' ? message : { message };

    this.logger.log({
      level,
      ...logMessage,
      context,
      trace,
      timestamp: new Date().toISOString(),
    });
  }
}
