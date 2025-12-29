
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDownloadUrl, deleteFile } from '@/lib/s3';
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const file = await prisma.uploadedFile.findUnique({
      where: { id },
      include: {
        submission: {
          select: {
            id: true,
            code: true,
            createdBy: true,
            reviews: {
              select: {
                reviewerId: true
              }
            }
          }
        },
        uploadedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // ✅ Enhanced permissions check for double-blind review security
    const isOwner = file.uploadedBy === session.uid;
    const isSubmissionAuthor = file.submission?.createdBy === session.uid;
    const isAdmin = ['SYSADMIN', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'].includes(
      session.role
    );
    
    // ✅ Check if current user is an assigned reviewer for this submission
    const isAssignedReviewer = file.submission?.reviews?.some(
      review => review.reviewerId === session.uid
    ) || false;

    if (!isOwner && !isSubmissionAuthor && !isAdmin && !isAssignedReviewer) {
      // 🔒 Log unauthorized access attempt
      await logAudit({
        actorId: session.uid,
        action: AuditEventType.FILE_ACCESS_DENIED,
        object: `UploadedFile:${id}`,
        after: { 
          reason: 'Unauthorized access attempt',
          submissionCode: file.submission?.code 
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      });
      
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ Generate signed URL with reduced expiry (15 minutes for security)
    // For reviewers, use shorter expiry; for others use 1 hour
    const expiryTime = isAssignedReviewer && !isAdmin ? 900 : 3600; // 15 min vs 1 hour
    const downloadUrl = await getDownloadUrl(file.cloudStoragePath, expiryTime);

    // 🔒 Log file access for audit trail
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.FILE_ACCESSED,
      object: `UploadedFile:${id}`,
      after: { 
        fileName: file.originalName,
        submissionCode: file.submission?.code,
        accessType: isAssignedReviewer ? 'reviewer' : (isAdmin ? 'admin' : 'author'),
        expirySeconds: expiryTime
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      file: {
        ...file,
        downloadUrl,
        // 🔒 Remove sensitive author information for reviewers
        submission: isAssignedReviewer && !isAdmin ? {
          id: file.submission?.id,
          code: file.submission?.code
          // ❌ Don't include createdBy for reviewers
        } : file.submission
      }
    });
  } catch (error) {
    console.error('File fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const file = await prisma.uploadedFile.findUnique({
      where: { id }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check permissions (only owner or admin can delete)
    const isOwner = file.uploadedBy === session.uid;
    const isAdmin = ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'].includes(session.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from S3
    await deleteFile(file.cloudStoragePath);

    // Delete from database
    await prisma.uploadedFile.delete({
      where: { id }
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: 'FILE_DELETE',
      object: `UploadedFile:${id}`,
      before: file,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
