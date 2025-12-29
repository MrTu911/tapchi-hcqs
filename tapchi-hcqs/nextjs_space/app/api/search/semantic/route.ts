
/**
 * Semantic Search API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { semanticSearch } from '@/lib/search-engine'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    // Get published submissions
    const submissions = await prisma.submission.findMany({
      where: {
        status: 'PUBLISHED',
        ...(category ? { category: { code: category } } : {})
      },
      include: {
        category: true
      }
    })

    // Perform semantic search
    const results = await semanticSearch(
      { query, limit },
      submissions.map((s: any) => ({
        id: s.id,
        title: s.title,
        abstractVn: s.abstractVn || undefined,
        abstractEn: s.abstractEn || undefined,
        keywords: s.keywords
      }))
    )

    // Enrich results with full submission data
    const enrichedResults = results.map(result => {
      const submission = submissions.find((s: any) => s.id === result.id)
      return {
        ...result,
        code: submission?.code,
        category: submission?.category,
        createdAt: submission?.createdAt
      }
    })

    return NextResponse.json({ results: enrichedResults })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
