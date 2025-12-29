import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics
 * Only accessible by SYSADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only SYSADMIN can access audit logs
    if (session.role !== Role.SYSADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get time range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    // Get statistics
    const [total, byAction, byUser, recent] = await Promise.all([
      // Total count
      prisma.auditLog.count({
        where: { createdAt: { gte: dateFrom } },
      }),
      
      // By action
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: dateFrom } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      
      // By user
      prisma.auditLog.groupBy({
        by: ['actorId'],
        where: {
          createdAt: { gte: dateFrom },
          actorId: { not: null },
        },
        _count: true,
        orderBy: { _count: { actorId: 'desc' } },
        take: 10,
      }),
      
      // Recent critical events
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'LOGIN_FAILED',
              'ACCESS_DENIED',
              'PERMISSION_DENIED',
              'USER_DELETED',
              'ARTICLE_DELETED',
              'BACKUP_RESTORED',
            ],
          },
          createdAt: { gte: dateFrom },
        },
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    
    // Enrich user statistics with names
    const userIds = byUser.map((u) => u.actorId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true },
    });
    
    const userMap = new Map(users.map((u) => [u.id, u]));
    const byUserEnriched = byUser.map((stat) => ({
      actorId: stat.actorId,
      count: stat._count,
      user: stat.actorId ? userMap.get(stat.actorId) : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        total,
        byAction: byAction.map((a) => ({
          action: a.action,
          count: a._count,
        })),
        byUser: byUserEnriched,
        recent,
        period: {
          days,
          from: dateFrom.toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
