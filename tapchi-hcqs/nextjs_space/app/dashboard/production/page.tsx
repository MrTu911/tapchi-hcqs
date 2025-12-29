'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Upload, Check, Loader2, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Production {
  id: string;
  articleId: string;
  layoutUrl: string;
  doi: string | null;
  published: boolean;
  publishedAt: string | null;
  notes: string | null;
  article: {
    submission: {
      title: string;
      author: { fullName: string; org: string };
    };
  };
  issue: { number: number; year: number; volume: { volumeNo: number } } | null;
}

export default function ProductionPage() {
  const { data: session } = useSession() || {};
  const [productions, setProductions] = useState<Production[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductions();
    fetchIssues();
  }, []);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production');
      const data = await res.json();
      if (data.success) {
        setProductions(data.data);
      } else {
        toast.error(data.message || 'Không thể tải danh sách');
      }
    } catch (error) {
      console.error('Fetch productions error:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
      }
    } catch (error) {
      console.error('Fetch issues error:', error);
    }
  };

  const handlePublish = async () => {
    if (!selectedProduction) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/production/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionId: selectedProduction.id,
          issueId: selectedIssueId || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Xuất bản bài viết thành công');
        setIsPublishDialogOpen(false);
        fetchProductions();
      } else {
        toast.error(data.message || 'Xuất bản thất bại');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPublishDialog = (production: Production) => {
    setSelectedProduction(production);
    setSelectedIssueId(''); // Will be set from issues list
    setIsPublishDialogOpen(true);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản xuất & Xuất bản</h1>
          <p className="text-gray-600 mt-1">Quản lý dàn trang và xuất bản bài viết</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Bài viết ({productions.length})</CardTitle>
          <CardDescription>Bài viết sẵn sàng xuất bản</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : productions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Printer className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Không có bài viết nào trong sản xuất</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bài viết</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>DOI</TableHead>
                    <TableHead>Số tạp chí</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.article.submission.title}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.article.submission.author.fullName}</div>
                        <div className="text-sm text-gray-500">{item.article.submission.author.org}</div>
                      </TableCell>
                      <TableCell>
                        {item.doi ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.doi}</code>
                        ) : (
                          <span className="text-gray-400">Chưa có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.issue ? (
                          <Badge variant="outline">
                            Vol. {item.issue.volume.volumeNo}, No. {item.issue.number} ({item.issue.year})
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Chưa gán</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.published ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Đã xuất bản
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Printer className="w-3 h-3 mr-1" />
                            Chờ xuất bản
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.layoutUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={item.layoutUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          {!item.published && session?.user && 'role' in session.user && ['EIC', 'SYSADMIN'].includes((session.user as any).role) && (
                            <Button variant="default" size="sm" onClick={() => handleOpenPublishDialog(item)}>
                              <Upload className="w-4 h-4 mr-1" />
                              Xuất bản
                            </Button>
                          )}
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

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xuất bản Bài viết</DialogTitle>
            <DialogDescription>
              {selectedProduction?.article.submission.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="issue">Gán vào Số tạp chí (tùy chọn)</Label>
              <Select value={selectedIssueId} onValueChange={setSelectedIssueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn số tạp chí..." />
                </SelectTrigger>
                <SelectContent>
                  {issues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      Vol. {issue.volume.volumeNo}, No. {issue.number} ({issue.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Lưu ý:</strong> Sau khi xuất bản, bài viết sẽ hiển thị công khai trên website và không thể hoàn tác.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handlePublish} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xuất bản...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Xuất bản
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
