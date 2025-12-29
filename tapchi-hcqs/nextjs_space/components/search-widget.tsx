
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';

export default function SearchWidget() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-950 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"></div>
        <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400 flex items-center gap-2">
          <Search className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Tìm kiếm
        </h4>
      </div>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm..."
            className="w-full px-4 py-3 pr-12 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-900 dark:text-white transition-all duration-300 shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white p-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Tìm kiếm theo tiêu đề, tác giả, từ khóa...
        </p>
      </form>
    </div>
  );
}
