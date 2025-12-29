
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get issue details
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        volume: true
      }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số báo' },
        { status: 404 }
      )
    }

    // Construct PDF path based on issue number
    const pdfPath = join(process.cwd(), 'public', 'issues', `issue-${String(issue.number).padStart(2, '0')}-${issue.year}.pdf`)

    try {
      // Read the PDF file
      const pdfBuffer = await readFile(pdfPath)

      // Set response headers
      const headers = new Headers()
      headers.set('Content-Type', 'application/pdf')
      headers.set('Content-Disposition', `attachment; filename="So-${String(issue.number).padStart(2, '0')}-${issue.year}.pdf"`)
      headers.set('Content-Length', pdfBuffer.length.toString())

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers
      })
    } catch (fileError) {
      console.error('Error reading PDF file:', fileError)
      return NextResponse.json(
        { error: 'Không tìm thấy file PDF' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error downloading issue PDF:', error)
    return NextResponse.json(
      { error: 'Lỗi khi tải xuống số báo' },
      { status: 500 }
    )
  }
}
