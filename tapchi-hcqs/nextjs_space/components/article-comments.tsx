"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Loader2, User as UserIcon, Clock, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface User {
  id: string;
  fullName: string;
  org?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: User;
}

interface ArticleCommentsProps {
  articleId: string;
}

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit comment
  const submitComment = async () => {
    if (!commentInput.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          content: commentInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Bình luận của bạn đang chờ kiểm duyệt');
        setCommentInput('');
        // Không hiển thị ngay bình luận vì cần kiểm duyệt
      } else {
        toast.error(data.error || 'Không thể gửi bình luận');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      // User not logged in
    } finally {
      setCheckingAuth(false);
    }
  };

  // Auto-refresh comments (polling every 10 seconds)
  useEffect(() => {
    checkAuth();
    fetchComments();
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [articleId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Bình luận ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <div className="space-y-3">
          <Textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder={
              currentUser
                ? 'Viết bình luận của bạn...'
                : 'Vui lòng đăng nhập để bình luận'
            }
            disabled={!currentUser || submitting}
            rows={4}
            maxLength={2000}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {commentInput.length}/2000 ký tự
            </span>
            {currentUser ? (
              <Button
                onClick={submitComment}
                disabled={submitting || !commentInput.trim()}
                size="sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Gửi bình luận
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => window.location.href = '/auth/signin'}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Đăng nhập để bình luận
              </Button>
            )}
          </div>
          {!currentUser && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              🔒 Vui lòng <a href="/auth/login" className="underline font-medium">
đăng nhập</a> để đăng bình luận.
            </p>
          )}
        </div>

        <Separator />

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Chưa có bình luận nào</p>
              <p className="text-sm mt-1">Hãy là người đầu tiên bình luận!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {comment.user?.fullName || 'Ẩn danh'}
                    </span>
                    {comment.user?.org && (
                      <Badge variant="outline" className="text-xs">
                        {comment.user.org}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong className="font-medium">🛡️ Lưu ý:</strong> Tất cả bình luận sẽ được kiểm duyệt
            trước khi hiển thị công khai. Bình luận cần tuân thủ quy tắc cộng đồng và
            mang tính xây dựng.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
