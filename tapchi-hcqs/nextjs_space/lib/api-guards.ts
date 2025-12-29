/**
 * API Guards
 * Provides authentication and authorization middleware for API routes
 */

import { NextRequest } from 'next/server';
import { getServerSession, JWTPayload } from './auth';
import { AuthenticationError, AuthorizationError } from './error-handler';
import { logger } from './logger';
import { Role } from '@prisma/client';

export type AuthSession = {
  user: {
    id: string;
    email: string;
    role: Role;
    fullName?: string;
  };
};

/**
 * Get authenticated session or throw error
 */
export async function requireAuth(req?: NextRequest): Promise<AuthSession> {
  const payload = await getServerSession();

  if (!payload?.uid) {
    logger.security('Unauthorized access attempt', {
      path: req?.url,
      ip: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip'),
    });
    throw new AuthenticationError('Vui lòng đăng nhập để tiếp tục');
  }

  // Convert JWTPayload to AuthSession format
  return {
    user: {
      id: payload.uid,
      email: payload.email,
      role: payload.role as Role,
      fullName: payload.fullName,
    },
  };
}

/**
 * Check if user has required role(s)
 */
export async function requireRole(
  allowedRoles: Role[],
  req?: NextRequest
): Promise<AuthSession> {
  const session = await requireAuth(req);

  if (!allowedRoles.includes(session.user.role)) {
    logger.security('Unauthorized role access', {
      userId: session.user.id,
      userRole: session.user.role,
      requiredRoles: allowedRoles,
      path: req?.url,
    });
    throw new AuthorizationError(
      `Chỉ ${allowedRoles.join(', ')} mới có quyền truy cập`
    );
  }

  return session;
}

/**
 * Check if user is an editor (Managing Editor or EIC)
 */
export async function requireEditor(req?: NextRequest): Promise<AuthSession> {
  return requireRole(['MANAGING_EDITOR', 'EIC', 'SYSADMIN'], req);
}

/**
 * Check if user is an admin (EIC or SysAdmin)
 */
export async function requireAdmin(req?: NextRequest): Promise<AuthSession> {
  return requireRole(['EIC', 'SYSADMIN'], req);
}

/**
 * Check if user is a reviewer
 */
export async function requireReviewer(req?: NextRequest): Promise<AuthSession> {
  return requireRole(['REVIEWER', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'], req);
}

/**
 * Check if user is an author
 */
export async function requireAuthor(req?: NextRequest): Promise<AuthSession> {
  return requireRole(['AUTHOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'], req);
}

/**
 * Check if user can perform action on resource
 */
export function canAccessResource(
  session: AuthSession,
  resourceOwnerId: string,
  allowedRoles: Role[] = []
): boolean {
  // Owner can access their own resource
  if (session.user.id === resourceOwnerId) {
    return true;
  }

  // Check if user has allowed role
  if (allowedRoles.length > 0 && allowedRoles.includes(session.user.role)) {
    return true;
  }

  return false;
}

/**
 * Assert user can access resource or throw error
 */
export function assertCanAccessResource(
  session: AuthSession,
  resourceOwnerId: string,
  allowedRoles: Role[] = [],
  message: string = 'Không có quyền truy cập tài nguyên này'
) {
  if (!canAccessResource(session, resourceOwnerId, allowedRoles)) {
    logger.security('Resource access denied', {
      userId: session.user.id,
      userRole: session.user.role,
      resourceOwnerId,
    });
    throw new AuthorizationError(message);
  }
}
