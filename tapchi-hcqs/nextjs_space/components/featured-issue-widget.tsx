
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';

interface Issue {
  id: string;
  number: number;
  year: number;
  title?: string;
  coverImage?: string;
  description?: string;
}

interface FeaturedIssueWidgetProps {
  issue: Issue | null;
}

export default function FeaturedIssueWidget({ issue }: FeaturedIssueWidgetProps) {
  if (!issue) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-950 dark:via-blue-950 dark:to-purple-950 p-5 rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-8 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full"></div>
        <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-blue-700 dark:from-emerald-400 dark:to-blue-400 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Số mới nhất
        </h4>
      </div>
      
      <Link href={`/issues/${issue.id}`} className="block group mb-4">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300">
          {issue.coverImage ? (
            <Image
              src={issue.coverImage}
              alt={`Số ${issue.number}/${issue.year}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 dark:from-emerald-700 dark:via-blue-700 dark:to-purple-700 flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-white opacity-30" />
            </div>
          )}
          {/* Overlay badge */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Số {issue.number}/{issue.year}
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </Link>

      <div className="bg-white/60 dark:bg-gray-900/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 mb-4">
        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-2 leading-relaxed">
          {issue.title || issue.description || 'Chuyên đề "Công nghệ quân sự hiện đại"'}
        </p>
      </div>

      <Link
        href={`/issues/${issue.id}`}
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 group"
      >
        <BookOpen className="h-4 w-4" />
        Đọc số này
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
