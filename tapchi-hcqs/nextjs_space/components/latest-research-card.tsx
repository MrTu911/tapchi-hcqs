
import Link from 'next/link';
import { FileText, BookOpen, User2, Building2, ArrowRight, Sparkles } from 'lucide-react';

interface Article {
  id: string;
  submission: {
    title: string;
    abstractVn?: string | null;
    abstractEn?: string | null;
    author: {
      fullName: string;
      org?: string | null;
    };
  };
}

interface LatestResearchCardProps {
  article: Article | null;
}

export default function LatestResearchCard({ article }: LatestResearchCardProps) {
  if (!article) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1 w-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full"></div>
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-blue-700 dark:from-emerald-400 dark:to-blue-400 font-['Montserrat']">
          Bài nghiên cứu mới nhất
        </h3>
        <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 dark:from-gray-800 dark:via-emerald-900/20 dark:to-blue-900/20 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-2xl transition-all duration-300 group">
        {/* New Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            MỚI NHẤT
          </span>
        </div>

        <Link
          href={`/articles/${article.id}`}
          className="block group/title"
        >
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 group-hover/title:text-emerald-600 dark:group-hover/title:text-emerald-400 transition-colors leading-snug">
            {article.submission.title}
          </h4>
        </Link>
        
        {/* Author Info */}
        <div className="flex flex-col gap-2 mb-4 p-3 bg-white/60 dark:bg-gray-900/40 rounded-xl border border-emerald-100 dark:border-emerald-900">
          <div className="flex items-start gap-2">
            <User2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">Tác giả:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{article.submission.author.fullName}</span>
            </div>
          </div>
          {article.submission.author.org && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">Đơn vị:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">{article.submission.author.org}</span>
              </div>
            </div>
          )}
        </div>

        {/* Abstract */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-5 line-clamp-3 leading-relaxed">
          {article.submission.abstractVn || article.submission.abstractEn}
        </p>
        
        {/* CTA Button */}
        <Link
          href={`/articles/${article.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 group/btn"
        >
          <BookOpen className="h-4 w-4" />
          Đọc toàn văn
          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
