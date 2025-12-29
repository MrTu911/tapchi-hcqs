
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Newspaper, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface News {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  category?: string;
  coverImage?: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  views: number;
  createdAt: string;
  author?: {
    fullName: string;
  };
}

const categories = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Call for Paper' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'news', label: 'Tin tức' },
];

export default function NewsManagementPage() {
  const router = useRouter();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNews();
  }, [page, category]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (category !== 'all') {
        params.append('category', category);
      }
      
      if (keyword) {
        params.append('keyword', keyword);
      }
      
      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setNews(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message || 'Lỗi khi tải tin tức');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Lỗi khi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchNews();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const newsItem = news.find(n => n.id === deleteId);
      if (!newsItem) return;
      
      const response = await fetch(`/api/news/${newsItem.slug}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Xóa tin tức thành công');
        fetchNews();
      } else {
        toast.error(data.message || 'Lỗi khi xóa tin tức');
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Lỗi khi xóa tin tức');
    } finally {
      setDeleteId(null);
    }
  };

  const togglePublish = async (newsItem: News) => {
    try {
      const response = await fetch(`/api/news/${newsItem.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: !newsItem.isPublished,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(
          newsItem.isPublished ? 'Đã ẩn tin tức' : 'Đã công khai tin tức'
        );
        fetchNews();
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const toggleFeatured = async (newsItem: News) => {
    try {
      const response = await fetch(`/api/news/${newsItem.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFeatured: !newsItem.isFeatured,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(
          newsItem.isFeatured ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật'
        );
        fetchNews();
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Lỗi khi cập nhật');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="h-8 w-8" />
            Quản lý Tin tức
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tin tức, thông báo và sự kiện
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/admin/cms/news/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo tin mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Tìm kiếm tin tức..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-sm"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm
          </Button>
        </div>
        
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Lượt xem</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : news.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chưa có tin tức nào
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-md">
                    <div className="flex items-start gap-2">
                      {item.isFeatured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                      )}
                      <span className="line-clamp-2">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category && (
                      <Badge variant="outline">
                        {categories.find(c => c.value === item.category)?.label || item.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.author?.fullName || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {item.views}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.isPublished ? (
                      <Badge>Công khai</Badge>
                    ) : (
                      <Badge variant="secondary">Nháp</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.publishedAt
                      ? format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatured(item)}
                        title={item.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            item.isFeatured ? 'fill-yellow-500 text-yellow-500' : ''
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublish(item)}
                        title={item.isPublished ? 'Ẩn' : 'Công khai'}
                      >
                        {item.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/admin/cms/news/${item.slug}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span className="text-sm">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
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
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
