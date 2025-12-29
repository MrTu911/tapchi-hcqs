
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, TrendingUp } from 'lucide-react';

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  coverImage?: string;
  publishedAt?: string | Date;
  category?: string;
}

interface NewsGridSectionProps {
  title: string;
  news: NewsItem[];
  category?: string;
}

export default function NewsGridSection({ title, news, category }: NewsGridSectionProps) {
  if (!news || news.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1 w-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full"></div>
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-blue-700 dark:from-emerald-400 dark:to-blue-400 font-['Montserrat']">
          {title}
        </h3>
        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {news.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="flex gap-4 bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative w-32 h-32 flex-shrink-0">
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-emerald-400 to-blue-500 dark:from-emerald-700 dark:via-emerald-600 dark:to-blue-700 flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-white opacity-50" />
                </div>
              )}
              {/* Colored overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
              <h4 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2 leading-snug">
                {item.title}
              </h4>
              {item.publishedAt && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
