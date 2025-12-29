/**
 * Global Error Handler
 * Provides unified error handling across all API routes
 * Supports Prisma, Zod, and custom errors
 */

import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Chưa đăng nhập') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Không có quyền truy cập') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Không tìm thấy tài nguyên') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Dữ liệu đã tồn tại') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Lỗi cơ sở dữ liệu') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * Handle different types of errors and return appropriate Response
 */
export function handleError(err: unknown, context: string): NextResponse {
  // Log error with context
  logger.error({
    context,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    return NextResponse.json(
      {
        error: err.message,
        code: err.code,
        context,
      },
      { status: err.statusCode }
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return NextResponse.json(
      {
        error: 'Dữ liệu không hợp lệ',
        code: 'VALIDATION_ERROR',
        details: errors,
        context,
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'Dữ liệu đã tồn tại',
            code: 'DUPLICATE_ENTRY',
            field: (err.meta?.target as string[])?.join(', '),
            context,
          },
          { status: 409 }
        );

      case 'P2025':
        return NextResponse.json(
          {
            error: 'Không tìm thấy dữ liệu',
            code: 'NOT_FOUND',
            context,
          },
          { status: 404 }
        );

      case 'P2003':
        return NextResponse.json(
          {
            error: 'Dữ liệu liên quan không tồn tại',
            code: 'FOREIGN_KEY_CONSTRAINT',
            field: err.meta?.field_name,
            context,
          },
          { status: 400 }
        );

      case 'P2014':
        return NextResponse.json(
          {
            error: 'Vi phạm ràng buộc dữ liệu',
            code: 'RELATION_VIOLATION',
            context,
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            error: 'Lỗi cơ sở dữ liệu',
            code: 'DATABASE_ERROR',
            prismaCode: err.code,
            context,
          },
          { status: 500 }
        );
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Dữ liệu không hợp lệ cho cơ sở dữ liệu',
        code: 'PRISMA_VALIDATION_ERROR',
        context,
      },
      { status: 400 }
    );
  }

  // Handle Prisma initialization errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error: 'Không thể kết nối cơ sở dữ liệu',
        code: 'DATABASE_CONNECTION_ERROR',
        context,
      },
      { status: 503 }
    );
  }

  // Generic error fallback
  return NextResponse.json(
    {
      error: 'Đã xảy ra lỗi hệ thống',
      code: 'INTERNAL_ERROR',
      context,
      message: err instanceof Error ? err.message : 'Unknown error',
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error, context) as R;
    }
  };
}

/**
 * Assert a condition, throw error if false
 */
export function assert(
  condition: boolean,
  message: string,
  ErrorClass: typeof AppError = AppError
): asserts condition {
  if (!condition) {
    throw new ErrorClass(message);
  }
}

/**
 * Assert a value is not null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = 'Dữ liệu không tồn tại'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
}
