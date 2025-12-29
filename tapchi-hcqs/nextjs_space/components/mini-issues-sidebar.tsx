
import Image from 'next/image';
import Link from 'next/link';

interface Issue {
  id: string;
  number: number;
  year: number;
  coverImage?: string;
  title?: string;
  volume?: {
    volumeNo: number;
  };
}

interface MiniIssuesSidebarProps {
  issues: Issue[];
}

export default function MiniIssuesSidebar({ issues }: MiniIssuesSidebarProps) {
  if (!issues || issues.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
        <h4 className="font-medium text-sm mb-3">Các số mới</h4>
        <p className="text-xs text-muted-foreground">Chưa có số tạp chí</p>
      </div>
    );
  }

  return (
    <aside className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
      <h4 className="font-medium text-sm mb-3 text-emerald-700 dark:text-emerald-400">
        Các số mới
      </h4>
      <div className="space-y-3">
        {issues.slice(0, 4).map((issue) => (
          <Link
            key={issue.id}
            href={`/issues/${issue.id}`}
            className="flex gap-2 pb-3 border-b border-dashed last:border-b-0 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded p-1 transition-colors group"
          >
            <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 border">
              {issue.coverImage ? (
                <Image
                  src={issue.coverImage}
                  alt={`Số ${issue.number}/${issue.year}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <b className="block text-xs text-emerald-700 dark:text-emerald-400">
                Số {issue.number}/{issue.year}
              </b>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {issue.title || `Tổng quan hậu cần chiến lược`}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
