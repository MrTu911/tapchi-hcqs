
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/articles/[id]/assign-issue - Assign article to issue
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const submissionId = id
    const body = await req.json()
    const { issueId } = body

    if (!issueId) {
      return NextResponse.json(
        { error: 'Missing issueId' },
        { status: 400 }
      )
    }

    // Check if submission exists and is accepted
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'ACCEPTED' && submission.status !== 'IN_PRODUCTION') {
      return NextResponse.json(
        { error: 'Only accepted submissions can be assigned to issues' },
        { status: 400 }
      )
    }

    // Check if issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Create or update article
    const article = await prisma.article.upsert({
      where: { submissionId },
      create: {
        submissionId,
        issueId
      },
      update: {
        issueId
      },
      include: {
        submission: true,
        issue: {
          include: {
            volume: true
          }
        }
      }
    })

    // Update submission status to IN_PRODUCTION if not already
    if (submission.status === 'ACCEPTED') {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'IN_PRODUCTION' }
      })
    }

    return NextResponse.json({
      success: true,
      data: article
    })
  } catch (error) {
    console.error('Error assigning article to issue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
