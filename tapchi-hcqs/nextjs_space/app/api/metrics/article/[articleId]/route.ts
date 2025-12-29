
/**
 * Article Metrics API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params

    let metrics = await prisma.articleMetrics.findUnique({
      where: { articleId }
    })

    if (!metrics) {
      // Create default metrics if not exists
      metrics = await prisma.articleMetrics.create({
        data: { articleId }
      })
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Get metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params
    const { action, country } = await request.json()

    if (!['view', 'download'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get or create metrics
    let metrics = await prisma.articleMetrics.findUnique({
      where: { articleId }
    })

    if (!metrics) {
      metrics = await prisma.articleMetrics.create({
        data: { articleId }
      })
    }

    // Update metrics
    const updateData: any = {}

    if (action === 'view') {
      updateData.views = { increment: 1 }
      updateData.lastViewedAt = new Date()

      if (country) {
        const viewsByCountry = (metrics.viewsByCountry as any) || {}
        viewsByCountry[country] = (viewsByCountry[country] || 0) + 1
        updateData.viewsByCountry = viewsByCountry
      }

      const month = new Date().toISOString().substring(0, 7)
      const viewsByMonth = (metrics.viewsByMonth as any) || {}
      viewsByMonth[month] = (viewsByMonth[month] || 0) + 1
      updateData.viewsByMonth = viewsByMonth
    } else if (action === 'download') {
      updateData.downloads = { increment: 1 }
      updateData.lastDownloadedAt = new Date()
    }

    const updatedMetrics = await prisma.articleMetrics.update({
      where: { articleId },
      data: updateData
    })

    return NextResponse.json({ metrics: updatedMetrics })
  } catch (error) {
    console.error('Update metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to update metrics' },
      { status: 500 }
    )
  }
}
