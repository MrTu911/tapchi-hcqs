
import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.uid) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })

    if (!user || !['SYSADMIN', 'MANAGING_EDITOR', 'EIC'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { blocks } = body

    if (!Array.isArray(blocks)) {
      return NextResponse.json({ success: false, message: 'Invalid blocks array' }, { status: 400 })
    }

    // Update orders in a transaction
    await prisma.$transaction(
      blocks.map((block: { id: string; order: number }) =>
        prisma.pageBlock.update({
          where: { id: block.id },
          data: { order: block.order }
        })
      )
    )

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_PAGE_BLOCKS_ORDER',
      entity: 'PageBlock',
      metadata: { blockCount: blocks.length }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering blocks:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
