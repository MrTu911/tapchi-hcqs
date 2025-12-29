"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  FileText,
  Calendar,
  User,
  Tag,
  Eye,
  Download,
  TrendingUp,
  Loader2,
  BookOpen,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  title: string;
  abstractVn: string | null;
  abstractEn: string | null;
  keywords: string[];
  category: {
    id: string;
    name: string;
  } | null;
  author: {
    name: string;
    org: string | null;
  };
  publishedAt: string | null;
  doi: string | null;
  views: number;
  downloads: number;
  issue: {
    volume: number;
    number: number;
    year: number;
  } | null;
  relevanceScore: string;
}

interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Tự động tìm kiếm khi URL thay đổi (bookmark/share support)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      toast.error('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
      const data = await res.json();

      if (data.success && data.data) {
        setResults(data.data.results || []);
        setTotalResults(data.data.total || 0);
        
        // Cập nhật URL cho bookmark/share
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('q', searchQuery);
        window.history.pushState({}, '', newUrl.toString());

        if (data.data.results.length === 0) {
          toast.info('Không tìm thấy kết quả phù hợp');
        }
      } else {
        toast.error(data.message || 'Lỗi khi tìm kiếm');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setTotalResults(0);
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Tìm kiếm bài báo khoa học
          </h1>
          <p className="text-slate-600 text-lg">
            Tìm kiếm toàn văn trên cơ sở dữ liệu bài báo đã xuất bản
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Nhập tên bài báo, tác giả, từ khóa..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Tìm kiếm
                  </>
                )}
              </Button>
            </form>

            {/* Quick Tips */}
            <div className="mt-4 flex items-start gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Mẹo:</strong> Hệ thống tìm kiếm trên tiêu đề, tóm tắt, từ khóa. 
                Để tìm kiếm nâng cao hơn, vui lòng sử dụng <Link href="/search/advanced" className="text-emerald-600 hover:underline">Tìm kiếm nâng cao</Link>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {hasSearched && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-slate-700 font-medium">
                Tìm thấy <strong className="text-emerald-600">{totalResults}</strong> kết quả
                {query && <span className="text-slate-500"> cho "{query}"</span>}
              </span>
            </div>
            <Link href="/search/advanced">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Tìm kiếm nâng cao
              </Button>
            </Link>
          </div>
        )}

        {/* Results List */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
            <p className="text-slate-600">Đang tìm kiếm...</p>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Không tìm thấy kết quả
              </h3>
              <p className="text-slate-500 mb-6">
                Thử sử dụng từ khóa khác hoặc tìm kiếm nâng cao
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleClear} variant="outline">
                  Xóa tìm kiếm
                </Button>
                <Link href="/search/advanced">
                  <Button>
                    <Filter className="w-4 h-4 mr-2" />
                    Tìm kiếm nâng cao
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <Link 
                        href={`/articles/${article.id}`}
                        className="text-xl font-semibold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-2"
                      >
                        {article.title}
                      </Link>
                      {article.issue && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                          <BookOpen className="w-4 h-4" />
                          <span>
                            Số {article.issue.number}, Tập {article.issue.volume} ({article.issue.year})
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                      <TrendingUp className="w-3 h-3" />
                      {(parseFloat(article.relevanceScore) * 100).toFixed(1)}%
                    </Badge>
                  </div>

                  {/* Category */}
                  {article.category && (
                    <Badge variant="secondary" className="mb-3">
                      {article.category.name}
                    </Badge>
                  )}

                  {/* Author & Organization */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{article.author.name}</span>
                    </div>
                    {article.author.org && (
                      <span className="text-slate-500">• {article.author.org}</span>
                    )}
                    {article.publishedAt && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>

                  {/* Abstract */}
                  {article.abstractVn && (
                    <p className="text-slate-600 text-sm mb-3 line-clamp-3">
                      {article.abstractVn}
                    </p>
                  )}

                  {/* Keywords */}
                  {article.keywords && article.keywords.length > 0 && (
                    <div className="flex items-start gap-2 mb-3">
                      <Tag className="w-4 h-4 mt-0.5 text-slate-400" />
                      <div className="flex flex-wrap gap-1">
                        {article.keywords.slice(0, 5).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {article.keywords.length > 5 && (
                          <Badge variant="outline" className="text-xs">+{article.keywords.length - 5}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator className="my-3" />

                  {/* Stats & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{article.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{article.downloads}</span>
                      </div>
                      {article.doi && (
                        <span className="text-xs font-mono">
                          DOI: {article.doi}
                        </span>
                      )}
                    </div>

                    <Link href={`/articles/${article.id}`}>
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Initial State (No search yet) */}
        {!loading && !hasSearched && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-4">
                <Search className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Bắt đầu tìm kiếm
              </h3>
              <p className="text-slate-500 mb-6">
                Nhập từ khóa ở trên để tìm kiếm bài báo khoa học
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-1">Tìm kiếm nhanh</h4>
                  <p className="text-sm text-slate-500">Tìm theo tiêu đề, tác giả, từ khóa</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-1">Kết quả chính xác</h4>
                  <p className="text-sm text-slate-500">Xếp hạng theo độ phù hợp</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
