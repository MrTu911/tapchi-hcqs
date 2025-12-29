
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

/**
 * GET /api/articles/[id]/versions
 * Lấy lịch sử các phiên bản của bài báo
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const versions = await prisma.articleVersion.findMany({
      where: { articleId: params.id },
      include: {
        submitter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { version: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: versions
    })
  } catch (error) {
    console.error('Error fetching article versions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/articles/[id]/versions
 * Tạo phiên bản mới cho bài báo
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title, titleEn, abstract, abstractEn, pdfUrl, pdfFile, note } = body

    // Kiểm tra xem bài báo có tồn tại không
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: {
        submission: {
          select: {
            title: true
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    // Lấy version cuối cùng
    const lastVersion = await prisma.articleVersion.findFirst({
      where: { articleId: params.id },
      orderBy: { version: 'desc' }
    })

    const newVersionNumber = (lastVersion?.version ?? 0) + 1

    // Tạo version mới
    const newVersion = await prisma.articleVersion.create({
      data: {
        articleId: params.id,
        version: newVersionNumber,
        title: title || article.submission.title,
        titleEn: titleEn,
        abstract: abstract,
        abstractEn: abstractEn,
        pdfUrl: pdfUrl,
        pdfFile: pdfFile,
        submittedBy: session.uid,
        note: note
      },
      include: {
        submitter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Cập nhật bài báo nếu có file PDF mới
    if (pdfFile || pdfUrl) {
      await prisma.article.update({
        where: { id: params.id },
        data: {
          pdfFile: pdfFile || article.pdfFile,
          approvalStatus: 'PENDING' // Reset lại trạng thái duyệt khi có phiên bản mới
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: newVersion,
      message: `Đã tạo phiên bản ${newVersionNumber} thành công`
    })
  } catch (error) {
    console.error('Error creating article version:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
