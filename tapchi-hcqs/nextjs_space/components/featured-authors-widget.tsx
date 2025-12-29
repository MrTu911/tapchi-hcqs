
import { Users, Award, Building2 } from 'lucide-react';

interface Author {
  id: string;
  fullName: string;
  academicTitle?: string;
  academicDegree?: string;
  specialization?: string;
}

interface FeaturedAuthorsWidgetProps {
  authors: Author[];
}

export default function FeaturedAuthorsWidget({ authors }: FeaturedAuthorsWidgetProps) {
  if (!authors || authors.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
        <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Tác giả tiêu biểu
        </h4>
      </div>
      <ul className="space-y-3">
        {authors.slice(0, 5).map((author, index) => (
          <li key={author.id} className="group">
            <div className="bg-white/60 dark:bg-gray-900/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-md">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-1">
                    {author.academicTitle && `${author.academicTitle} `}
                    {author.academicDegree && `${author.academicDegree} `}
                    {author.fullName}
                  </p>
                  {author.specialization && (
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {author.specialization}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
