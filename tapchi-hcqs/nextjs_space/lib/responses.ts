/**
 * Standardized API Response Helpers
 */

import { NextResponse } from 'next/server';

/**
 * Success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message: message || 'Thành công',
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Validation error response
 */
export function validationErrorResponse(
  errors: Record<string, any>,
  message: string = 'Dữ liệu không hợp lệ'
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      details: errors,
      timestamp: new Date().toISOString()
    },
    { status: 400 }
  );
}

/**
 * Not found response
 */
export function notFoundResponse(
  message: string = 'Không tìm thấy'
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    },
    { status: 404 }
  );
}
