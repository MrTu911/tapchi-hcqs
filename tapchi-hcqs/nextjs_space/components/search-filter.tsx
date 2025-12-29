"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, Calendar, User, Building2, Tag, BookOpen, SortAsc } from 'lucide-react';
import { toast } from 'sonner';

interface SearchFilterProps {
  onFilter: (filters: FilterState) => void;
  onReset?: () => void;
  loading?: boolean;
}

export interface FilterState {
  year?: string;
  yearFrom?: string;
  yearTo?: string;
  keyword?: string;
  author?: string;
  affiliation?: string;
  categoryId?: string;
  doi?: string;
  issueId?: string;
  sortBy?: string;
  order?: string;
}

interface Category {
  id: string;
  name: string;
  code: string;
}

export default function SearchFilter({ onFilter, onReset, loading }: SearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    yearFrom: '',
    yearTo: '',
    keyword: '',
    author: '',
    affiliation: '',
    categoryId: '',
    doi: '',
    issueId: '',
    sortBy: 'publishedAt',
    order: 'desc'
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Load categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    // Lọc bỏ các filter trống
    const activeFilters = Object.entries(filters)
      .filter(([_, value]) => value && value.trim() !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // Cập nhật danh sách filter đang active
    setActiveFilters(Object.keys(activeFilters));

    if (Object.keys(activeFilters).length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tiêu chí lọc');
      return;
    }

    onFilter(activeFilters);
  };

  const handleReset = () => {
    setFilters({
      year: '',
      yearFrom: '',
      yearTo: '',
      keyword: '',
      author: '',
      affiliation: '',
      categoryId: '',
      doi: '',
      issueId: '',
      sortBy: 'publishedAt',
      order: 'desc'
    });
    setActiveFilters([]);
    if (onReset) onReset();
  };

  const removeFilter = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
    setActiveFilters(prev => prev.filter(f => f !== key));
    
    // Tự động áp dụng lại filter
    setTimeout(() => {
      const newFilters = { ...filters, [key]: '' };
      const active = Object.entries(newFilters)
        .filter(([_, value]) => value && value.trim() !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      if (Object.keys(active).length > 0) {
        onFilter(active);
      } else if (onReset) {
        onReset();
      }
    }, 100);
  };

  const filterLabels: Record<string, string> = {
    year: 'Năm',
    yearFrom: 'Từ năm',
    yearTo: 'Đến năm',
    keyword: 'Từ khóa',
    author: 'Tác giả',
    affiliation: 'Đơn vị',
    categoryId: 'Danh mục',
    doi: 'DOI',
    issueId: 'Số tạp chí',
    sortBy: 'Sắp xếp theo',
    order: 'Thứ tự'
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardTitle className="flex items-center gap-2 text-emerald-700">
          <Filter className="w-5 h-5" />
          Bộ lọc nhiều tiêu chí
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm text-slate-500 mb-2 block">Đang lọc theo:</Label>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(key => (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {filterLabels[key]}: {filters[key as keyof FilterState]}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-600" 
                    onClick={() => removeFilter(key)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Năm */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              Năm xuất bản (chính xác)
            </Label>
            <Input
              type="number"
              placeholder="VD: 2024"
              value={filters.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Danh mục */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              Danh mục
            </Label>
            <Select value={filters.categoryId} onValueChange={(v) => handleChange('categoryId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Khoảng năm */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Từ năm</Label>
            <Input
              type="number"
              placeholder="VD: 2020"
              value={filters.yearFrom}
              onChange={(e) => handleChange('yearFrom', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Đến năm</Label>
            <Input
              type="number"
              placeholder="VD: 2024"
              value={filters.yearTo}
              onChange={(e) => handleChange('yearTo', e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Từ khóa */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            Từ khóa
          </Label>
          <Input
            placeholder="VD: Trí tuệ nhân tạo, Học máy..."
            value={filters.keyword}
            onChange={(e) => handleChange('keyword', e.target.value)}
          />
        </div>

        {/* Tác giả */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            Tác giả
          </Label>
          <Input
            placeholder="Tên tác giả"
            value={filters.author}
            onChange={(e) => handleChange('author', e.target.value)}
          />
        </div>

        {/* Đơn vị */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            Đơn vị công tác
          </Label>
          <Input
            placeholder="Tên đơn vị"
            value={filters.affiliation}
            onChange={(e) => handleChange('affiliation', e.target.value)}
          />
        </div>

        <Separator />

        {/* Sắp xếp */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-slate-500" />
              Sắp xếp theo
            </Label>
            <Select value={filters.sortBy} onValueChange={(v) => handleChange('sortBy', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publishedAt">Ngày xuất bản</SelectItem>
                <SelectItem value="views">Lượt xem</SelectItem>
                <SelectItem value="downloads">Lượt tải</SelectItem>
                <SelectItem value="title">Tiêu đề</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Thứ tự</Label>
            <Select value={filters.order} onValueChange={(v) => handleChange('order', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Giảm dần</SelectItem>
                <SelectItem value="asc">Tăng dần</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            <Search className="w-4 h-4 mr-2" />
            Áp dụng lọc
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Xóa lọc
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
