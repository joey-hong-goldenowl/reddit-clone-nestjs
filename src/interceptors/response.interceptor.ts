import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

type SuccessResponse<T> = {
  response: {
    data: T;
    message: string;
  };
  status_code: number;
};

function respond<T>(data: T, statusCode: number): SuccessResponse<T> {
  return {
    response: {
      data,
      message: 'success'
    },
    status_code: statusCode
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    return next.handle().pipe(map(data => respond(data, response.statusCode)));
  }
}
