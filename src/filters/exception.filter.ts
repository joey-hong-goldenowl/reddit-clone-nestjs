import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

type ErrorResponse = {
  statusCode: number;
  message: string;
  error: string;
};

@Catch()
export class BaseExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse() as ErrorResponse;
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        response: {
          data: null,
          message: errorResponse?.message ?? 'Something went wrong'
        },
        status_code: errorResponse.statusCode
      });
    } else {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        response: {
          data: null,
          message: 'Something went wrong'
        },
        status_code: HttpStatus.INTERNAL_SERVER_ERROR
      });
    }
  }
}
