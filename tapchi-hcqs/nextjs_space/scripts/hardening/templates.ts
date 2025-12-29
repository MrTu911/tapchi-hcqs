/**
 * Templates chuẩn cho API routes
 */

export const GET_TEMPLATE = `import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { requireAuth, requireRole } from '@/lib/api-guards';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/responses';

/**
 * GET {{ENDPOINT}}
 * Mô tả: {{DESCRIPTION}}
 * Auth: Required
 * Roles: {{ROLES}}
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await requireAuth(req);
    
    // 2. Authorization (if role-specific)
    // await requireRole(session, [{{ROLES}}]);
    
    // 3. Log request
    logger.info('{{LOG_MESSAGE}}', {
      userId: session.user.id,
      context: '{{CONTEXT}}'
    });
    
    // 4. Business logic
    const data = await prisma.{{MODEL}}.findMany({
      // Add your query here
    });
    
    // 5. Success response
    return successResponse(data);
    
  } catch (error) {
    // 6. Error handling
    return handleApiError(error, '{{CONTEXT}}');
  }
}`;

export const POST_TEMPLATE = `import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { requireAuth, requireRole } from '@/lib/api-guards';
import { {{SCHEMA}} } from '@/lib/validators';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/responses';

/**
 * POST {{ENDPOINT}}
 * Mô tả: {{DESCRIPTION}}
 * Auth: Required
 * Roles: {{ROLES}}
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await requireAuth(req);
    
    // 2. Authorization
    await requireRole(session, [{{ROLES}}]);
    
    // 3. Parse & validate input
    const body = await req.json();
    const validatedData = {{SCHEMA}}.parse(body);
    
    // 4. Log request
    logger.info('{{LOG_MESSAGE}}', {
      userId: session.user.id,
      context: '{{CONTEXT}}'
    });
    
    // 5. Business logic
    const result = await prisma.{{MODEL}}.create({
      data: {
        ...validatedData,
        createdBy: session.user.id
      }
    });
    
    // 6. Log success
    logger.info('{{SUCCESS_MESSAGE}}', {
      userId: session.user.id,
      {{ID_FIELD}}: result.id,
      context: '{{CONTEXT}}'
    });
    
    // 7. Success response
    return successResponse(result, '{{SUCCESS_TEXT}}', 201);
    
  } catch (error) {
    // 8. Error handling
    return handleApiError(error, '{{CONTEXT}}');
  }
}`;

export const PUT_TEMPLATE = `import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { requireAuth, requireRole } from '@/lib/api-guards';
import { {{SCHEMA}} } from '@/lib/validators';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * PUT {{ENDPOINT}}
 * Mô tả: {{DESCRIPTION}}
 * Auth: Required
 * Roles: {{ROLES}}
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await requireAuth(req);
    
    // 2. Authorization
    await requireRole(session, [{{ROLES}}]);
    
    // 3. Parse & validate input
    const body = await req.json();
    const validatedData = {{SCHEMA}}.parse(body);
    
    // 4. Check existence
    const existing = await prisma.{{MODEL}}.findUnique({
      where: { id: params.id }
    });
    
    if (!existing) {
      return errorResponse('{{NOT_FOUND_MESSAGE}}', 404);
    }
    
    // 5. Log request
    logger.info('{{LOG_MESSAGE}}', {
      userId: session.user.id,
      {{ID_FIELD}}: params.id,
      context: '{{CONTEXT}}'
    });
    
    // 6. Business logic
    const result = await prisma.{{MODEL}}.update({
      where: { id: params.id },
      data: validatedData
    });
    
    // 7. Log success
    logger.info('{{SUCCESS_MESSAGE}}', {
      userId: session.user.id,
      {{ID_FIELD}}: result.id,
      context: '{{CONTEXT}}'
    });
    
    // 8. Success response
    return successResponse(result, '{{SUCCESS_TEXT}}');
    
  } catch (error) {
    // 9. Error handling
    return handleApiError(error, '{{CONTEXT}}');
  }
}`;

export const DELETE_TEMPLATE = `import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { requireAuth, requireRole } from '@/lib/api-guards';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * DELETE {{ENDPOINT}}
 * Mô tả: {{DESCRIPTION}}
 * Auth: Required
 * Roles: {{ROLES}}
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await requireAuth(req);
    
    // 2. Authorization
    await requireRole(session, [{{ROLES}}]);
    
    // 3. Check existence
    const existing = await prisma.{{MODEL}}.findUnique({
      where: { id: params.id }
    });
    
    if (!existing) {
      return errorResponse('{{NOT_FOUND_MESSAGE}}', 404);
    }
    
    // 4. Log request
    logger.security('{{LOG_MESSAGE}}', {
      userId: session.user.id,
      {{ID_FIELD}}: params.id,
      context: '{{CONTEXT}}'
    });
    
    // 5. Business logic
    await prisma.{{MODEL}}.delete({
      where: { id: params.id }
    });
    
    // 6. Log success
    logger.security('{{SUCCESS_MESSAGE}}', {
      userId: session.user.id,
      {{ID_FIELD}}: params.id,
      context: '{{CONTEXT}}'
    });
    
    // 7. Success response
    return successResponse(null, '{{SUCCESS_TEXT}}');
    
  } catch (error) {
    // 8. Error handling
    return handleApiError(error, '{{CONTEXT}}');
  }
}`;
