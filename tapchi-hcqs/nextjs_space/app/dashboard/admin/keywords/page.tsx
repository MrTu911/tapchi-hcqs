'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Search, Loader2, AlertTriangle, Tag, TrendingUp, Hash, Link2 } from 'lucide-react';

interface Keyword {
  id: string;
  term: string;
  category?: string | null;
  usage: number;
  synonyms: string[];
  relatedTerms: string[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Quân sự',
  'Hậu cần',
  'Công nghệ',
  'Quản lý',
  'Chiến lược',
  'Đào tạo',
  'Trang thiết bị',
  'Y tế',
  'Tài chính',
  'Khác'
];

export default function KeywordsManagementPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [deleteKeyword, setDeleteKeyword] = useState<Keyword | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    term: '',
    category: '',
    synonyms: '',
    relatedTerms: ''
  });

  // Fetch keywords
  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('limit', '500');

      const response = await fetch(`/api/keywords?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setKeywords(result.data);
      } else {
        toast.error('Không thể tải danh sách từ khóa');
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [searchTerm, selectedCategory]);

  // Reset form
  const resetForm = () => {
    setFormData({
      term: '',
      category: '',
      synonyms: '',
      relatedTerms: ''
    });
    setEditingKeyword(null);
  };

  // Open dialog for create/edit
  const openDialog = (keyword?: Keyword) => {
    if (keyword) {
      setEditingKeyword(keyword);
      setFormData({
        term: keyword.term,
        category: keyword.category || '',
        synonyms: keyword.synonyms.join(', '),
        relatedTerms: keyword.relatedTerms.join(', ')
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.term.trim()) {
      toast.error('Vui lòng nhập từ khóa');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        term: formData.term.trim(),
        category: formData.category || undefined,
        synonyms: formData.synonyms
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        relatedTerms: formData.relatedTerms
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
      };

      const url = editingKeyword 
        ? `/api/keywords/${editingKeyword.id}` 
        : '/api/keywords';
      const method = editingKeyword ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingKeyword ? 'Cập nhật từ khóa thành công' : 'Tạo từ khóa thành công');
        setIsDialogOpen(false);
        resetForm();
        fetchKeywords();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving keyword:', error);
      toast.error('Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteKeyword) return;

    try {
      const response = await fetch(`/api/keywords/${deleteKeyword.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Xóa từ khóa thành công');
        setDeleteKeyword(null);
        fetchKeywords();
      } else {
        toast.error(result.error || 'Không thể xóa từ khóa');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast.error('Có lỗi xảy ra khi xóa');
    }
  };

  // Statistics
  const stats = {
    total: keywords.length,
    totalUsage: keywords.reduce((sum, k) => sum + k.usage, 0),
    mostUsed: keywords[0],
    categories: Array.from(new Set(keywords.map(k => k.category).filter(Boolean))).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý từ khóa</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý từ khóa, danh mục và từ đồng nghĩa
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm từ khóa
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số từ khóa</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt sử dụng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phổ biến nhất</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {stats.mostUsed ? stats.mostUsed.term : 'N/A'}
            </div>
            {stats.mostUsed && (
              <p className="text-xs text-muted-foreground">
                {stats.mostUsed.usage} lượt sử dụng
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Danh mục</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tìm theo từ khóa hoặc từ đồng nghĩa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách từ khóa</CardTitle>
          <CardDescription>
            Hiển thị {keywords.length} từ khóa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : keywords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy từ khóa nào</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Từ khóa</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead className="text-center">Số lần sử dụng</TableHead>
                    <TableHead>Từ đồng nghĩa</TableHead>
                    <TableHead>Từ liên quan</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          {keyword.term}
                        </div>
                      </TableCell>
                      <TableCell>
                        {keyword.category ? (
                          <Badge variant="secondary">{keyword.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Chưa phân loại</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={keyword.usage > 0 ? "default" : "outline"}>
                          {keyword.usage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {keyword.synonyms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {keyword.synonyms.slice(0, 3).map((syn, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {syn}
                              </Badge>
                            ))}
                            {keyword.synonyms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{keyword.synonyms.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.relatedTerms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {keyword.relatedTerms.slice(0, 2).map((term, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                            {keyword.relatedTerms.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{keyword.relatedTerms.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(keyword)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteKeyword(keyword)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingKeyword ? 'Chỉnh sửa từ khóa' : 'Thêm từ khóa mới'}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin từ khóa và các từ liên quan
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="term">Từ khóa <span className="text-destructive">*</span></Label>
              <Input
                id="term"
                placeholder="Ví dụ: hậu cần quân sự"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-form">Danh mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category-form">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không phân loại</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="synonyms">Từ đồng nghĩa</Label>
              <Textarea
                id="synonyms"
                placeholder="Nhập các từ đồng nghĩa, phân cách bằng dấu phẩy. Ví dụ: logistics, bảo đảm hậu cần"
                value={formData.synonyms}
                onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Các từ có nghĩa tương tự, phân cách bằng dấu phẩy
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relatedTerms">Từ liên quan</Label>
              <Textarea
                id="relatedTerms"
                placeholder="Nhập các từ liên quan, phân cách bằng dấu phẩy. Ví dụ: vận tải, kho tàng, trang bị"
                value={formData.relatedTerms}
                onChange={(e) => setFormData({ ...formData, relatedTerms: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Các từ có liên quan đến chủ đề, phân cách bằng dấu phẩy
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  editingKeyword ? 'Cập nhật' : 'Tạo mới'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKeyword} onOpenChange={() => setDeleteKeyword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa từ khóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa từ khóa <strong>{deleteKeyword?.term}</strong>? 
              Hành động này không thể hoàn tác.
              {deleteKeyword && deleteKeyword.usage > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span className="text-sm text-yellow-800">
                    Từ khóa này đã được sử dụng {deleteKeyword.usage} lần trong các bài viết.
                  </span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
