export const dynamic = "force-dynamic"


/**
 * 🧱 ROLE ESCALATION APPROVAL - APPROVE/REJECT
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/api-guards'
import { createAuditLog } from '@/lib/audit-logger'
import { handleError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req)
    
    // Chỉ admin và EIC mới có quyền approve/reject
    if (!['SYSADMIN', 'EIC'].includes(session.user.role)) {
      throw new AuthorizationError('Forbidden: Chỉ SYSADMIN và EIC mới có quyền')
    }
    
    const params = await context.params
    const requestId = params.id
    const body = await req.json()
    
    const { action, rejectionReason } = body
    
    if (!action || !['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const request = await prisma.roleEscalationRequest.findUnique({
      where: { id: requestId }
    })
    
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    
    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request already processed' },
        { status: 400 }
      )
    }
    
    if (action === 'approve') {
      // Cập nhật role của user
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole }
      })
      
      // Cập nhật request
      await prisma.roleEscalationRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedBy: session.user.id,
          approvedAt: new Date()
        }
      })
      
      await createAuditLog({
        userId: session.user.id,
        action: 'APPROVE_ROLE_ESCALATION',
        entity: 'USER',
        entityId: request.userId,
        metadata: {
          requestId,
          fromRole: request.currentRole,
          toRole: request.requestedRole
        }
      })
    } else if (action === 'reject') {
      await prisma.roleEscalationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason,
          approvedBy: session.user.id
        }
      })
      
      await createAuditLog({
        userId: session.user.id,
        action: 'REJECT_ROLE_ESCALATION',
        entity: 'ROLE_ESCALATION',
        entityId: requestId,
        metadata: { reason: rejectionReason }
      })
    } else if (action === 'cancel') {
      await prisma.roleEscalationRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ context: "API_ADMIN", message: "Error processing role escalation request:", error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to process role escalation request' },
      { status: 500 }
    )
  }
}
