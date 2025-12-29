
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkUpdateSchema = z.array(
  z.object({
    id: z.string(),
    position: z.number().int().min(0),
  })
)

// POST /api/banners/bulk-update-order - Update display order of banners
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SYSADMIN and EIC can reorder banners
    if (user.role !== 'SYSADMIN' && user.role !== 'EIC') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins and editors-in-chief can reorder banners' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = bulkUpdateSchema.parse(body)

    // Update all banners in a transaction
    await prisma.$transaction(
      validated.map(({ id, position }) =>
        prisma.banner.update({
          where: { id },
          data: { 
            position,
            updatedBy: user.id
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Banner order updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating banner order:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update banner order' },
      { status: 500 }
    )
  }
}
