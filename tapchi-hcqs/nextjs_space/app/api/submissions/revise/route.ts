export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/s3'
import { createNotification } from '@/lib/notification-manager'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const submissionId = formData.get('submissionId') as string
    const versionNo = parseInt(formData.get('versionNo') as string)
    const manuscriptFile = formData.get('manuscript') as File
    const responseFile = formData.get('responseToReviewers') as File | null
    const changelog = formData.get('changelog') as string
    const coverLetter = formData.get('coverLetter') as string

    if (!submissionId || !manuscriptFile || !changelog) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify ownership
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.createdBy !== session.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (submission.status !== 'REVISION') {
      return NextResponse.json(
        { error: 'Submission does not require revision' },
        { status: 400 }
      )
    }

    // Upload manuscript file
    const manuscriptBuffer = Buffer.from(await manuscriptFile.arrayBuffer())
    const manuscriptKey = `submissions/${submissionId}/v${versionNo}/${Date.now()}-${manuscriptFile.name}`
    const manuscriptPath = await uploadFile(manuscriptBuffer, manuscriptKey)

    // Upload response file if provided
    let responsePath: string | undefined
    if (responseFile) {
      const responseBuffer = Buffer.from(await responseFile.arrayBuffer())
      const responseKey = `submissions/${submissionId}/v${versionNo}/response-${Date.now()}-${responseFile.name}`
      responsePath = await uploadFile(responseBuffer, responseKey)
    }

    // Create new version
    const newVersion = await prisma.submissionVersion.create({
      data: {
        submissionId,
        versionNo,
        filesetId: manuscriptPath,
        changelog
      }
    })

    // Update submission status back to UNDER_REVIEW
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'UNDER_REVIEW',
        lastStatusChangeAt: new Date()
      }
    })

    // Log audit
    await auditLogger.logSuccess(
      AuditEventType.SUBMISSION_UPDATED,
      {
        userId: session.uid,
        userEmail: session.email,
        userRole: session.role,
        details: {
          action: 'REVISION_SUBMITTED',
          submissionId,
          submissionCode: submission.code,
          versionNo,
          changelog,
          hasCoverLetter: !!coverLetter,
          hasResponseFile: !!responsePath
        }
      }
    )

    // Notify editors
    const editors = await prisma.user.findMany({
      where: {
        role: {
          in: ['EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']
        },
        isActive: true
      }
    })

    for (const editor of editors) {
      await createNotification({
        userId: editor.id,
        type: 'REVISION_REQUESTED',
        title: 'Bản chỉnh sửa mới đã được nộp',
        message: `Tác giả đã nộp bản chỉnh sửa cho bài "${submission.title}" (${submission.code})`,
        link: `/dashboard/editor/submissions/${submissionId}`
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        version: newVersion,
        message: 'Revision submitted successfully'
      }
    })
  } catch (error: any) {
    console.error('Revision submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
