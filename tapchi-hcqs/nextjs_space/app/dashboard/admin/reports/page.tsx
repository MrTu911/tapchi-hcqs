"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  FileDown,
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  BookOpen,
  User,
  Building2,
  Loader2,
  CheckCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import SearchFilter, { FilterState } from '@/components/search-filter';

/**
 * Trang quản trị xuất báo cáo
 * Module 3: Export Reports
 */
export default function ReportsPage() {
  const [filters, setFilters] = useState<FilterState>({});
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [stats, setStats] = useState<any>(null);

  const handleFilter = async (newFilters: FilterState) => {
    setFilters(newFilters);
    setLoading(true);

    try {
      // Xây dựng query string
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value as string);
        }
      });

      const res = await fetch(`/api/search/filter?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setPreview(data.data.results || []);
        setStats(data.data.stats || null);
        toast.success(`Tìm thấy ${data.data.results.length} bản ghi`);
      } else {
        toast.error(data.message || 'Lỗi khi lọc dữ liệu');
      }
    } catch (error) {
      console.error('Filter error:', error);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({});
    setPreview([]);
    setStats(null);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (preview.length === 0) {
      toast.warning('Vui lòng lọc dữ liệu trước khi xuất');
      return;
    }

    setExporting(format);

    try {
      const endpoint = format === 'pdf' ? '/api/export/pdf' : '/api/export/excel';
      const filtersParam = encodeURIComponent(JSON.stringify(filters));
      const url = `${endpoint}?filters=${filtersParam}`;

      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `bao-cao-${format}-${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Xuất báo cáo {format.toUpperCase()} thành công!
        </div>
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Lỗi khi xuất ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Báo cáo & Xuất dữ liệu
          </h1>
          <p className="text-slate-600">
            Tạo báo cáo và xuất danh sách bài báo theo nhiều tiêu chí
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => handleExport('pdf')}
            disabled={preview.length === 0 || exporting !== null}
            variant="outline"
            className="border-red-200 hover:bg-red-50"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Xuất PDF
          </Button>
          <Button
            onClick={() => handleExport('excel')}
            disabled={preview.length === 0 || exporting !== null}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {exporting === 'excel' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Xuất Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bộ lọc */}
        <div className="lg:col-span-1">
          <SearchFilter 
            onFilter={handleFilter}
            onReset={handleReset}
            loading={loading}
          />
        </div>

        {/* Preview & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thống kê */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-emerald-600">{stats.totalResults}</div>
                  <div className="text-sm text-slate-500">Tổng bài báo</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.withIssue}</div>
                  <div className="text-sm text-slate-500">Có số tạp chí</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.featured}</div>
                  <div className="text-sm text-slate-500">Bài nổi bật</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.categories}</div>
                  <div className="text-sm text-slate-500">Danh mục</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Xem trước dữ liệu
                </div>
                {preview.length > 0 && (
                  <Badge variant="secondary">
                    {preview.length} bản ghi
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Dữ liệu sẽ được xuất với đầy đủ thông tin chi tiết
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                  <p className="text-slate-600">Đang tải dữ liệu...</p>
                </div>
              )}

              {!loading && preview.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <Filter className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    Chưa có dữ liệu
                  </h3>
                  <p className="text-slate-500">
                    Vui lòng áp dụng bộ lọc để xem dữ liệu
                  </p>
                </div>
              )}

              {!loading && preview.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm text-slate-500 mb-4">
                    Hiển thị 5 bản ghi đầu tiên. Báo cáo đầy đủ sẽ bao gồm tất cả {preview.length} bản ghi.
                  </div>
                  {preview.slice(0, 5).map((item, index) => (
                    <Card key={item.id} className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                              {item.title}
                            </h4>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.author.name}
                              </div>
                              {item.author.org && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {item.author.org}
                                </div>
                              )}
                              {item.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.category.name}
                                </Badge>
                              )}
                              {item.article?.issue && (
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  Số {item.article.issue.number}/{item.article.issue.year}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {preview.length > 5 && (
                    <div className="text-center text-sm text-slate-500 pt-4">
                      ... và {preview.length - 5} bản ghi khác
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
