import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../database/generated/prisma/client.js';

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const { status, body } = this.toError(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private toError(exception: unknown): { status: number; body: ApiErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      return {
        status,
        body: HttpExceptionFilter.parseHttpException(status, payload),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { status, body } = HttpExceptionFilter.parsePrismaError(exception);
      return { status, body };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: 'internal_error',
          message: 'An unexpected error occurred',
        },
      },
    };
  }

  private static parseHttpException(
    status: number,
    payload: string | object,
  ): ApiErrorBody {
    if (typeof payload === 'string') {
      return {
        success: false,
        error: { code: HttpStatus[status] ?? 'http_error', message: payload },
      };
    }

    const asRecord = payload as Record<string, unknown>;
    const message = Array.isArray(asRecord.message)
      ? asRecord.message.join(', ')
      : (asRecord.message as string);
    return {
      success: false,
      error: {
        code: (asRecord.code as string) ?? HttpStatus[status] ?? 'http_error',
        message,
        details: asRecord.details,
      },
    };
  }

  private static parsePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): { status: number; body: ApiErrorBody } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            success: false,
            error: {
              code: 'unique_constraint_violation',
              message: 'A record with the same unique value already exists',
              details: error.meta ? { target: error.meta.target } : undefined,
            },
          },
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            success: false,
            error: {
              code: 'foreign_key_violation',
              message: 'The referenced record does not exist',
              details: error.meta ? { field_name: error.meta.field_name } : undefined,
            },
          },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: {
            success: false,
            error: {
              code: 'record_not_found',
              message: 'The requested record was not found',
            },
          },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            success: false,
            error: {
              code: 'database_error',
              message: 'A database operation failed',
            },
          },
        };
    }
  }
}
