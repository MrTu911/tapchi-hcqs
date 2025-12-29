
/**
 * Manual Cron Job Trigger API (for development/testing)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })

    if (!user || user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { jobType } = await request.json()

    // This would trigger specific cron jobs manually
    // For now, just create a job record
    const job = await prisma.scheduledJob.create({
      data: {
        type: jobType,
        status: 'PENDING',
        scheduledAt: new Date()
      }
    })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Run cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to run job' },
      { status: 500 }
    )
  }
}
