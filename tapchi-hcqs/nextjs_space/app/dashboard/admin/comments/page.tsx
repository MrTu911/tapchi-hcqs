"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Check,
  X,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
  user?: {
    id: string;
    fullName: string;
    org?: string;
  };
  article: {
    id: string;
    submission: {
      title: string;
    };
  };
}

export default function CommentsManagementPage() {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; commentId: string | null }>({
    open: false,
    commentId: null,
  });

  // Fetch all comments
  const fetchComments = async () => {
    try {
      const res = await fetch('/api/admin/comments');
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Không thể tải danh sách bình luận');
    } finally {
      setLoading(false);
    }
  };

  // Approve/Reject comment
  const handleApproval = async (commentId: string, isApproved: boolean) => {
    setActionLoading(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (isApproved ? 'Đã duyệt bình luận' : 'Đã từ chối bình luận'));
        await fetchComments();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete comment
  const handleDelete = async () => {
    if (!deleteDialog.commentId) return;

    setActionLoading(deleteDialog.commentId);
    try {
      const res = await fetch(`/api/comments/${deleteDialog.commentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa bình luận');
        await fetchComments();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
      setDeleteDialog({ open: false, commentId: null });
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // Filter comments
  const filteredComments = comments.filter((comment) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !comment.isApproved;
    if (filter === 'approved') return comment.isApproved;
    return true;
  });

  // Stats
  const stats = {
    total: comments.length,
    pending: comments.filter((c) => !c.isApproved).length,
    approved: comments.filter((c) => c.isApproved).length,
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý bình luận</h1>
        <p className="text-muted-foreground mt-1">
          Kiểm duyệt và quản lý bình luận công khai
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bình luận</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách bình luận</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Chờ duyệt ({stats.pending})
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                Đã duyệt ({stats.approved})
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tất cả ({stats.total})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredComments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Không có bình luận nào</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người bình luận</TableHead>
                    <TableHead>Bài viết</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {comment.user?.fullName || 'Ẩn danh'}
                          </p>
                          {comment.user?.org && (
                            <p className="text-xs text-muted-foreground">
                              {comment.user.org}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <Link
                          href={`/articles/${comment.article.id}`}
                          className="text-sm hover:underline line-clamp-2"
                          target="_blank"
                        >
                          {comment.article.submission.title}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm line-clamp-3">{comment.content}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </TableCell>
                      <TableCell>
                        {comment.isApproved ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Đã duyệt
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Chờ duyệt
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!comment.isApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(comment.id, true)}
                              disabled={actionLoading === comment.id}
                            >
                              {actionLoading === comment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Duyệt
                                </>
                              )}
                            </Button>
                          )}
                          {comment.isApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(comment.id, false)}
                              disabled={actionLoading === comment.id}
                            >
                              {actionLoading === comment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Bỏ duyệt
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: true, commentId: comment.id })}
                            disabled={actionLoading === comment.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, commentId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa bình luận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
