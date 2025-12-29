
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Eye, Search, Loader2, Calendar, User, Tag } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  summary?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: Date | null;
  createdAt: Date;
  views: number;
  author?: {
    fullName: string;
    email: string;
  };
}

const NEWS_CATEGORIES = [
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Call for Papers' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'research_news', label: 'Tin nghiên cứu' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'award', label: 'Giải thưởng' },
  { value: 'conference', label: 'Hội thảo' },
];

export default function NewsManagementPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchNews();
  }, [categoryFilter, statusFilter]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      let url = '/api/news?';
      const params = new URLSearchParams();
      
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter === 'published') params.append('isPublished', 'true');
      if (statusFilter === 'draft') params.append('isPublished', 'false');
      
      const response = await fetch(url + params.toString());
      const data = await response.json();
      
      if (data.success) {
        setNews(data.data.news);
      } else {
        toast.error(data.message || 'Lỗi khi tải danh sách tin tức');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/news/${deleteId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Đã xóa tin tức thành công');
        fetchNews();
      } else {
        toast.error(data.message || 'Lỗi khi xóa tin tức');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi xóa tin tức');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredNews = news.filter(item => {
    const matchSearch = searchTerm.trim() === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.titleEn?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch;
  });

  const getCategoryLabel = (category?: string | null) => {
    if (!category) return 'Chưa phân loại';
    const found = NEWS_CATEGORIES.find(c => c.value === category);
    return found?.label || category;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Tin tức</h1>
          <p className="text-muted-foreground">
            Quản lý tin tức, thông báo, sự kiện của tạp chí
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/admin/news/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo tin mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm kiếm và lọc tin tức</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {NEWS_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Đang tải...</span>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-muted-foreground">Chưa có tin tức nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead>Ngày đăng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.title}</div>
                        {item.titleEn && (
                          <div className="text-sm text-muted-foreground italic">
                            {item.titleEn}
                          </div>
                        )}
                        {item.isFeatured && (
                          <Badge variant="secondary" className="text-xs">
                            Nổi bật
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.author?.fullName || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.isPublished ? (
                        <Badge className="bg-green-500">Đã xuất bản</Badge>
                      ) : (
                        <Badge variant="secondary">Bản nháp</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.views}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {item.publishedAt 
                            ? format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })
                            : format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.isPublished && (
                          <Link href={`/news/${item.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/admin/news/${item.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tin tức này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
