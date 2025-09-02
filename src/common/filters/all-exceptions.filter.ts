import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NasaError } from '../errors';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle NasaError specially
    if (exception instanceof NasaError) {
      const nasaErrorResponse = exception.toJSON();
      this.logger.error(
        `${request.method} ${request.url} - ${nasaErrorResponse.code} - ${nasaErrorResponse.msg}`,
        exception.stack,
      );
      response.status(nasaErrorResponse.code).json(nasaErrorResponse);
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || 'Internal server error',
      ...(typeof message === 'object' && message !== null && { details: message }),
    };

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    response.status(status).json(errorResponse);
  }
}
