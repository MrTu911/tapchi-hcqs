import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import VersionComparison from '@/components/dashboard/version-comparison';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function SubmissionVersionsPage({ params }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  const { id } = params;

  // Fetch submission with versions directly from database
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      versions: {
        orderBy: {
          versionNo: 'desc'
        }
      },
      files: {
        where: {
          fileType: 'MANUSCRIPT'
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          originalName: true,
          fileType: true,
          cloudStoragePath: true,
          createdAt: true
        }
      }
    }
  });

  if (!submission) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Không tìm thấy bài viết</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check permissions
  const userRole = session.role;
  const isAuthor = submission.createdBy === session.uid;
  const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole);
  const isReviewer = await prisma.review.findFirst({
    where: {
      submissionId: id,
      reviewerId: session.uid
    }
  });

  if (!isAuthor && !isEditor && !isReviewer) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Bạn không có quyền truy cập trang này</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Prepare version data with submission details for each version
  // Since versions don't store full submission data, we'll use the current submission data
  const versionsWithData = submission.versions.map((v: any) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    submission: {
      title: submission.title,
      abstractVn: submission.abstractVn,
      abstractEn: submission.abstractEn,
      keywords: submission.keywords
    }
  }));

  const currentVersion = {
    title: submission.title,
    abstractVn: submission.abstractVn,
    abstractEn: submission.abstractEn,
    keywords: submission.keywords,
    updatedAt: submission.createdAt.toISOString()
  };

  const submissionData = {
    id: submission.id,
    code: submission.code,
    title: submission.title,
    status: submission.status,
    author: submission.author
  };

  const versions = versionsWithData;
  const files = submission.files.map((f: any) => ({
    ...f,
    createdAt: f.createdAt.toISOString()
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/editor/submissions/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Lịch sử phiên bản</h1>
            <p className="text-muted-foreground">{submissionData.code}</p>
          </div>
        </div>
        <Badge>{submissionData.status}</Badge>
      </div>

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {submissionData.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {submissionData.author.fullName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Mã bài: {submissionData.code}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Version Comparison Component */}
      <VersionComparison
        versions={versions}
        files={files}
        currentVersion={currentVersion}
      />
    </div>
  );
}
