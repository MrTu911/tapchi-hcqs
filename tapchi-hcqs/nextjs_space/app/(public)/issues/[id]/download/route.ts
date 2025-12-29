
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Tìm issue
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        year: true,
        title: true,
        volume: {
          select: {
            volumeNo: true
          }
        }
      }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số tạp chí' },
        { status: 404 }
      )
    }

    // Tạm thời trả về thông báo vì chưa có PDF file cho issue
    return NextResponse.json({
      message: 'Tính năng tải xuống đang được phát triển',
      issue: {
        title: issue.title,
        volume: issue.volume.volumeNo,
        number: issue.number,
        year: issue.year
      }
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Lỗi khi tải file' },
      { status: 500 }
    )
  }
}
