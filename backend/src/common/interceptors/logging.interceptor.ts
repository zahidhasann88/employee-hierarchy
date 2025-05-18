import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, headers, requestId } = req;
    const userAgent = headers['user-agent'] || '';
    const ip = req.ip || '';
    const contentLength = headers['content-length'] || 0;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    this.logger.log({
      message: `Incoming request`,
      method,
      url,
      requestId,
      ip,
      userAgent,
      contentLength,
      controller,
      handler,
    });

    const startTime = Date.now();
    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          
          let responseSize = 'unknown';
          if (data && typeof data === 'object') {
            try {
              responseSize = String(JSON.stringify(data).length);
            } catch (e) {
              // If data can't be stringified, don't log size
            }
          }
          
          this.logger.log({
            message: `Request completed`,
            method,
            url,
            requestId,
            responseTime,
            statusCode,
            responseSize,
            controller,
            handler,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error instanceof HttpException 
            ? error.getStatus() 
            : HttpStatus.INTERNAL_SERVER_ERROR;
          
          this.logger.error({
            message: `Request failed`,
            method,
            url,
            requestId,
            responseTime,
            statusCode,
            controller,
            handler,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
              code: error.code,
              detail: error.detail,
            },
          });
        },
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }
}