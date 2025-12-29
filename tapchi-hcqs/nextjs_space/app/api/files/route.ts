
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const fileType = searchParams.get('fileType');

    // Build query conditions
    const where: any = {};
    
    // Filter by submission ID if provided
    if (submissionId) {
      where.submissionId = submissionId;
    } else if (session.role === 'AUTHOR') {
      // Authors can only see their own files
      where.uploadedBy = session.uid;
    }

    // Filter by file type if provided
    if (fileType) {
      where.fileType = fileType;
    }

    const files = await prisma.uploadedFile.findMany({
      where,
      include: {
        uploadedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        submission: {
          select: {
            id: true,
            code: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Files fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
