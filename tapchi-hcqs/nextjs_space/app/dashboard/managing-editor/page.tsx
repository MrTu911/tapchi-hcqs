'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Eye,
  UserPlus,
  Loader2,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  overview: {
    totalSubmissions: number;
    recentSubmissions: number;
    pendingSubmissions: number;
    underReview: number;
    needsRevision: number;
    accepted: number;
    published: number;
    acceptanceRate: number;
    overdueSubmissions: number;
    averageProcessingDays: number;
  };
  statusStats: Array<{
    status: string;
    count: number;
  }>;
  reviews: {
    total: number;
    completed: number;
    pending: number;
    activeReviewers: number;
  };
  team: {
    totalEditors: number;
  };
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
  unassignedSubmissions: Array<{
    id: string;
    code: string;
    title: string;
    author: string;
    authorEmail: string;
    category: string;
    createdAt: string;
    securityLevel: string;
  }>;
}

interface Editor {
  id: string;
  fullName: string;
  email: string;
  role: string;
  org: string | null;
  academicTitle: string | null;
  position: string | null;
  currentWorkload: number;
}

export default function ManagingEditorDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [stats, setStats] = useState<Stats | null>(null);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [selectedEditor, setSelectedEditor] = useState<string>('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!session.user || !('role' in session.user) || !allowedRoles.includes((session.user as any).role)) {
      toast.error('Bạn không có quyền truy cập trang này');
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsRes = await fetch('/api/managing-editor/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Fetch editors list
      const editorsRes = await fetch('/api/managing-editor/assign');
      if (editorsRes.ok) {
        const editorsData = await editorsRes.json();
        setEditors(editorsData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmission = (submissionId: string) => {
    setSelectedSubmission(submissionId);
    setSelectedEditor('');
    setAssignNote('');
    setAssignDialogOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedSubmission || !selectedEditor) {
      toast.error('Vui lòng chọn editor');
      return;
    }

    try {
      setAssigning(true);

      const response = await fetch('/api/managing-editor/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission,
          editorId: selectedEditor,
          note: assignNote.trim() || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign');
      }

      toast.success('Đã phân công thành công!');
      setAssignDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi phân công');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'default';
      case 'UNDER_REVIEW':
        return 'secondary';
      case 'REVISION':
        return 'outline';
      case 'ACCEPTED':
        return 'default';
      case 'PUBLISHED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      NEW: 'Mới',
      DESK_REJECT: 'Từ chối ngay',
      UNDER_REVIEW: 'Đang phản biện',
      REVISION: 'Cần chỉnh sửa',
      ACCEPTED: 'Chấp nhận',
      REJECTED: 'Từ chối',
      IN_PRODUCTION: 'Đang sản xuất',
      PUBLISHED: 'Đã xuất bản'
    };
    return labels[status] || status;
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <span className="ml-2">Không thể tải dữ liệu dashboard</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bảng điều khiển Tổng Biên Tập</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý toàn bộ quy trình biên tập và phản biện
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <BarChart3 className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng số bài</CardDescription>
            <CardTitle className="text-3xl">{stats.overview.totalSubmissions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
              {stats.overview.recentSubmissions} bài trong 30 ngày qua
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ xử lý</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {stats.overview.pendingSubmissions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Bài mới chưa phân công
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang phản biện</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {stats.overview.underReview}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-1" />
              {stats.reviews.activeReviewers} phản biện viên đang hoạt động
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tỷ lệ chấp nhận</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.overview.acceptanceRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 mr-1" />
              {stats.overview.accepted} bài được chấp nhận
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <CardTitle className="text-lg">Quá hạn</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.overview.overdueSubmissions}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Bài vượt quá deadline
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-orange-600 mr-2" />
              <CardTitle className="text-lg">Cần chỉnh sửa</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.overview.needsRevision}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Bài đang chờ tác giả sửa
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <CardTitle className="text-lg">Thời gian xử lý TB</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.overview.averageProcessingDays}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Ngày từ nộp đến xuất bản
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Submissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bài mới chưa phân công</CardTitle>
            <CardDescription>
              {stats.unassignedSubmissions.length} bài cần được gán cho editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.unassignedSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p>Không có bài chưa phân công</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.unassignedSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{submission.code}</Badge>
                          <Badge variant="secondary">{submission.category}</Badge>
                          {submission.securityLevel !== 'PUBLIC' && (
                            <Badge variant="destructive">
                              {submission.securityLevel}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{submission.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Tác giả: {submission.author} ({submission.authorEmail})
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Nộp ngày:{' '}
                          {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/dashboard/editor/submissions/${submission.id}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAssignSubmission(submission.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Phân công
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố trạng thái</CardTitle>
            <CardDescription>Tất cả bài viết theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.statusStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <Badge variant={getStatusBadgeVariant(stat.status)}>
                    {getStatusLabel(stat.status)}
                  </Badge>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories and Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Chuyên mục</CardTitle>
            <CardDescription>Chuyên mục có nhiều bài nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCategories.map((category, index) => (
                <div key={category.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {index + 1}
                    </span>
                    <span>{category.categoryName}</span>
                  </div>
                  <Badge>{category.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đội ngũ biên tập</CardTitle>
            <CardDescription>Thông tin ban biên tập</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  <span>Tổng số editors</span>
                </div>
                <span className="font-bold text-lg">{stats.team.totalEditors}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  <span>Phản biện viên hoạt động</span>
                </div>
                <span className="font-bold text-lg">{stats.reviews.activeReviewers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  <span>Review hoàn thành</span>
                </div>
                <span className="font-bold text-lg">{stats.reviews.completed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600" />
                  <span>Review đang chờ</span>
                </div>
                <span className="font-bold text-lg">{stats.reviews.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Phân công bài viết cho Editor</DialogTitle>
            <DialogDescription>
              Chọn editor phù hợp để xử lý bài viết này
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editor">Chọn Editor *</Label>
              <Select value={selectedEditor} onValueChange={setSelectedEditor}>
                <SelectTrigger id="editor">
                  <SelectValue placeholder="Chọn editor..." />
                </SelectTrigger>
                <SelectContent>
                  {editors.map((editor) => (
                    <SelectItem key={editor.id} value={editor.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {editor.fullName} ({editor.role})
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          Workload: {editor.currentWorkload}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEditor && (
                <p className="text-xs text-muted-foreground mt-1">
                  {editors.find((e) => e.id === selectedEditor)?.email}
                  {editors.find((e) => e.id === selectedEditor)?.org &&
                    ` • ${editors.find((e) => e.id === selectedEditor)?.org}`}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="assign-note">Ghi chú (tuỳ chọn)</Label>
              <Textarea
                id="assign-note"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="Thêm ghi chú cho editor về bài viết này..."
                rows={3}
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">Lưu ý:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Deadline mặc định: 7 ngày kể từ khi phân công</li>
                <li>Editor sẽ nhận được thông báo qua email và hệ thống</li>
                <li>Có thể reassign sau nếu cần thiết</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              disabled={assigning}
            >
              Huỷ
            </Button>
            <Button onClick={handleConfirmAssignment} disabled={assigning || !selectedEditor}>
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang phân công...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Phân công
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
