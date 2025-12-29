

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    const where: any = {};
    if (category) where.category = category;
    if (key) where.key = key;

    const configs = await prisma.uIConfig.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // If specific key requested, return single value
    if (key && configs.length > 0) {
      return NextResponse.json({
        success: true,
        value: configs[0].value
      });
    }

    return NextResponse.json({
      success: true,
      configs
    });
  } catch (error) {
    console.error('UIConfig fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UI config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, description, category } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const config = await prisma.uIConfig.upsert({
      where: { key },
      update: {
        value,
        description,
        category,
        updatedBy: session.uid
      },
      create: {
        key,
        value,
        description,
        category: category || 'general',
        updatedBy: session.uid
      }
    });

    await logAudit({
      actorId: session.uid,
      action: 'UI_CONFIG_UPDATE',
      object: `UIConfig:${key}`,
      after: config,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('UIConfig update error:', error);
    return NextResponse.json(
      { error: 'Failed to update UI config' },
      { status: 500 }
    );
  }
}
