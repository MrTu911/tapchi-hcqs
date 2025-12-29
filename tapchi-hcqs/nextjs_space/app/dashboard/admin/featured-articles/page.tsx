"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Star,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Eye,
  MoveUp,
  MoveDown,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface FeaturedArticle {
  id: string;
  articleId: string;
  position: number;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
  article: {
    id: string;
    title: string;
    doi: string | null;
    publishedAt: string | null;
    views: number;
    downloads: number;
    submission: {
      author: {
        fullName: string;
        org: string | null;
      };
      category: {
        name: string;
      };
    };
    issue: {
      number: number;
      volume: {
        volumeNo: number;
      };
    } | null;
  };
}

interface SearchResult {
  id: string;
  title: string;
  author: string;
  category: string;
  status: string;
}

export default function FeaturedArticlesManagementPage() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<FeaturedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<FeaturedArticle | null>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Form states
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [reason, setReason] = useState('');
  const [position, setPosition] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchFeaturedArticles();
  }, []);

  const fetchFeaturedArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/featured-articles');
      const data = await res.json();

      if (data.success) {
        setArticles(data.data);
      } else {
        toast.error('Không thể tải danh sách bài viết nổi bật');
      }
    } catch (error) {
      console.error('Error fetching featured articles:', error);
      toast.error('Lỗi khi tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const searchArticles = async () => {
    if (!searchQuery.trim()) {
      toast.error('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `/api/search/advanced?keyword=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        toast.error('Không tìm thấy kết quả');
      }
    } catch (error) {
      console.error('Error searching articles:', error);
      toast.error('Lỗi khi tìm kiếm');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedArticleId) {
      toast.error('Vui lòng chọn bài viết');
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch('/api/admin/featured-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticleId,
          reason: reason || null,
          position: articles.length,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowAddDialog(false);
        resetForm();
        fetchFeaturedArticles();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error adding featured article:', error);
      toast.error('Lỗi khi thêm bài viết');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedArticle) return;

    try {
      setProcessing(true);
      const res = await fetch(`/api/admin/featured-articles/${selectedArticle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position,
          isActive,
          reason: reason || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowEditDialog(false);
        resetForm();
        fetchFeaturedArticles();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating featured article:', error);
      toast.error('Lỗi khi cập nhật bài viết');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;

    try {
      setProcessing(true);
      const res = await fetch(
        `/api/admin/featured-articles?id=${selectedArticle.id}`,
        { method: 'DELETE' }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowDeleteDialog(false);
        setSelectedArticle(null);
        fetchFeaturedArticles();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting featured article:', error);
      toast.error('Lỗi khi xóa bài viết');
    } finally {
      setProcessing(false);
    }
  };

  const openEditDialog = (article: FeaturedArticle) => {
    setSelectedArticle(article);
    setPosition(article.position);
    setIsActive(article.isActive);
    setReason(article.reason || '');
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setSelectedArticleId('');
    setReason('');
    setPosition(0);
    setIsActive(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedArticle(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            Quản lý bài viết nổi bật
          </h1>
          <p className="text-muted-foreground mt-2">
            Chọn các bài viết để hiển thị ở trang chủ
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm bài nổi bật
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số bài nổi bật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang hiển thị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {articles.filter((a) => a.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ẩn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {articles.filter((a) => !a.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài viết nổi bật</CardTitle>
          <CardDescription>
            Kéo thả để sắp xếp thứ tự hiển thị
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có bài viết nổi bật nào</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm bài đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article, index) => (
                <Card key={article.id} className="overflow-hidden">
                  <div className="flex items-start gap-4 p-4">
                    {/* Position Badge */}
                    <div className="flex flex-col items-center gap-2">
                      <Badge variant="outline" className="text-lg font-bold">
                        #{article.position + 1}
                      </Badge>
                      <div className="flex flex-col gap-1">
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // TODO: Implement move up
                            }}
                          >
                            <MoveUp className="h-3 w-3" />
                          </Button>
                        )}
                        {index < articles.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // TODO: Implement move down
                            }}
                          >
                            <MoveDown className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Article Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{article.article.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {article.article.submission.author.fullName}
                            {article.article.submission.author.org &&
                              ` - ${article.article.submission.author.org}`}
                          </p>
                        </div>
                        <Badge variant={article.isActive ? 'default' : 'secondary'}>
                          {article.isActive ? 'Hiển thị' : 'Ẩn'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>• {article.article.submission.category.name}</span>
                        {article.article.issue && (
                          <span>
                            • Số {article.article.issue.volume.volumeNo}/
                            {article.article.issue.number}
                          </span>
                        )}
                        <span>• {article.article.views} lượt xem</span>
                        <span>• {article.article.downloads} lượt tải</span>
                      </div>

                      {article.reason && (
                        <p className="text-sm bg-muted p-2 rounded">
                          <strong>Lý do chọn:</strong> {article.reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/articles/${article.articleId}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(article)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedArticle(article);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm bài viết nổi bật</DialogTitle>
            <DialogDescription>
              Tìm kiếm và chọn bài viết để hiển thị ở trang chủ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchArticles()}
              />
              <Button onClick={searchArticles} disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={
                      `p-3 rounded cursor-pointer hover:bg-muted transition-colors ${
                        selectedArticleId === result.id ? 'bg-primary/10 border-primary border' : ''
                      }`
                    }
                    onClick={() => setSelectedArticleId(result.id)}
                  >
                    <p className="font-medium">{result.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.author} • {result.category}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Lý do chọn (không bắt buộc)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Giải thích vì sao chọn bài này..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleAdd} disabled={processing || !selectedArticleId}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài viết nổi bật</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Bài viết</Label>
              <p className="font-medium">{selectedArticle?.article.title}</p>
            </div>

            <div>
              <Label htmlFor="edit-position">Vị trí hiển thị</Label>
              <Input
                id="edit-position"
                type="number"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value))}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Hiển thị</Label>
              <Switch
                id="edit-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div>
              <Label htmlFor="edit-reason">Lý do chọn</Label>
              <Textarea
                id="edit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn bỏ đánh dấu nổi bật cho bài viết:{' '}
              <strong>{selectedArticle?.article.title}</strong>?
              <br />
              <br />
              Bài viết sẽ không còn hiển thị ở danh sách nổi bật trên trang chủ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
