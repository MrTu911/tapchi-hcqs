
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: { volume: true }
  });

  if (!issue) {
    return {
      title: 'Không tìm thấy',
    };
  }

  return {
    title: `Xem số ${issue.number}/${issue.year} | Tạp chí Khoa học Hậu cần Quân sự`,
    description: issue.description || `Xem tạp chí số ${issue.number} năm ${issue.year}`,
  };
}

export default async function IssueViewerPage({ params }: Props) {
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      volume: true,
      articles: {
        orderBy: { publishedAt: 'desc' }
      }
    }
  });

  if (!issue) {
    notFound();
  }

  // Check if PDF file exists
  const pdfUrl = `/issues/issue-${String(issue.number).padStart(2, '0')}-${issue.year}.pdf`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/issues/${issue.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {issue.title || `Số ${issue.number} (${issue.year})`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tập {issue.volume?.volumeNo || issue.year} • {issue.articles.length} bài báo
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href={pdfUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Tải về PDF
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden" style={{ height: '800px' }}>
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            className="w-full h-full border-0"
            title={`Số ${issue.number} (${issue.year})`}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Nếu PDF không hiển thị, vui lòng sử dụng các nút bên dưới
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Mở trong tab mới
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={pdfUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Tải về
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-900 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự
          </p>
        </div>
      </div>
    </div>
  );
}
