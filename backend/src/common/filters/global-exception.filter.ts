import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../logger/logger.service';
import * as commonMessages from '../common.message';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request['requestId'];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string[] = [commonMessages.INTERNAL_SERVER_ERROR];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        message = Array.isArray(exceptionResponse['message'])
          ? exceptionResponse['message']
          : [exceptionResponse['message']];
      } else if (typeof exceptionResponse === 'string') {
        message = [exceptionResponse];
      }
    } else if (exception.name === 'QueryFailedError') {
      status = HttpStatus.BAD_REQUEST;
      message = ['Database operation failed'];

      if (exception.code === '23505') {
        message = ['Duplicate entry found'];
      }
    } else if (exception.name === 'EntityNotFoundError') {
      status = HttpStatus.NOT_FOUND;
      message = ['Resource not found'];
    }

    this.logger.error({
      message: 'Exception caught by global filter',
      path: request.url,
      method: request.method,
      requestId,
      statusCode: status,
      exceptionName: exception.name,
      exceptionMessage: exception.message,
      stack: exception.stack,
    });

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message : [message],
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
}
