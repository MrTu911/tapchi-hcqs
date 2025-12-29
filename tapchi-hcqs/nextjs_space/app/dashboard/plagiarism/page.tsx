'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FileSearch,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  Shield,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PlagiarismReport {
  id: string;
  articleId: string;
  score: number;
  reportUrl: string | null;
  method: string;
  matches: any[];
  checkedBy: string;
  checkedAt: string;
  notes: string | null;
  article: {
    id: string;
    submission: {
      title: string;
      author: {
        fullName: string;
        org: string;
      };
    };
  };
  checker: {
    fullName: string;
    email: string;
  };
}

interface Article {
  id: string;
  submissionId: string;
  submission: {
    title: string;
    author: {
      fullName: string;
    };
  };
}

// Color-coded thresholds
const getScoreConfig = (score: number) => {
  if (score >= 70) {
    return {
      label: 'Rất cao',
      color: 'bg-red-100 text-red-800 border-red-300',
      barColor: 'bg-red-600',
      icon: AlertTriangle,
      severity: 'critical',
    };
  } else if (score >= 40) {
    return {
      label: 'Cao',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      barColor: 'bg-orange-500',
      icon: AlertCircle,
      severity: 'high',
    };
  } else if (score >= 20) {
    return {
      label: 'Trung bình',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      barColor: 'bg-amber-400',
      icon: AlertCircle,
      severity: 'medium',
    };
  } else {
    return {
      label: 'Thấp',
      color: 'bg-green-100 text-green-800 border-green-300',
      barColor: 'bg-green-500',
      icon: CheckCircle,
      severity: 'low',
    };
  }
};

export default function PlagiarismCheckPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [reports, setReports] = useState<PlagiarismReport[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<PlagiarismReport | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch reports
  useEffect(() => {
    fetchReports();
    fetchArticles();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/plagiarism');
      const data = await res.json();

      if (data.success) {
        setReports(data.data);
      } else {
        toast.error(data.message || 'Không thể tải danh sách báo cáo');
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      // Fetch articles that are ACCEPTED but not yet checked
      const res = await fetch('/api/articles?status=ACCEPTED');
      const data = await res.json();

      if (data.success) {
        setArticles(data.data || []);
      }
    } catch (error) {
      console.error('Fetch articles error:', error);
    }
  };

  const handleCheckPlagiarism = async () => {
    if (!selectedArticleId) {
      toast.error('Vui lòng chọn bài viết');
      return;
    }

    try {
      setChecking(true);
      const res = await fetch('/api/plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: selectedArticleId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Kiểm tra đạo văn hoàn tất');
        setSelectedArticleId('');
        fetchReports();
      } else {
        toast.error(data.message || 'Kiểm tra thất bại');
      }
    } catch (error) {
      console.error('Check plagiarism error:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setChecking(false);
    }
  };

  const handleViewDetail = (report: PlagiarismReport) => {
    setSelectedReport(report);
    setIsDetailDialogOpen(true);
  };

  const filteredReports = reports.filter((item) => {
    const matchSearch = item.article.submission.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Kiểm tra Đạo văn
          </h1>
          <p className="text-gray-600 mt-1">
            Phát hiện và quản lý độ tương đồng nội dung
          </p>
        </div>
      </div>

      {/* Check New Article */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5" />
            Kiểm tra Bài viết Mới
          </CardTitle>
          <CardDescription>
            Chọn bài viết để chạy phân tích đạo văn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="article">Chọn bài viết</Label>
              <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bài viết..." />
                </SelectTrigger>
                <SelectContent>
                  {articles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.submission.title} - {article.submission.author.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCheckPlagiarism}
                disabled={checking || !selectedArticleId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Kiểm tra ngay
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md">
            <Label htmlFor="search">Tìm kiếm báo cáo</Label>
            <Input
              id="search"
              placeholder="Nhập tiêu đề bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Báo cáo Kiểm tra ({filteredReports.length})
          </CardTitle>
          <CardDescription>
            Lịch sử và kết quả phân tích đạo văn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileSearch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Chưa có báo cáo kiểm tra nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bài viết</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Độ tương đồng</TableHead>
                    <TableHead>Mức độ</TableHead>
                    <TableHead>Phương pháp</TableHead>
                    <TableHead>Ngày kiểm tra</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const config = getScoreConfig(report.score);
                    const Icon = config.icon;
                    return (
                      <TableRow key={report.id} className={config.severity === 'critical' ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div className="font-medium">
                            {report.article.submission.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{report.article.submission.author.fullName}</div>
                          <div className="text-sm text-gray-500">
                            {report.article.submission.author.org}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2 min-w-[200px]">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">{report.score.toFixed(1)}%</span>
                              <Icon className={`w-5 h-5 ${config.severity === 'critical' ? 'text-red-600' : config.severity === 'high' ? 'text-orange-500' : config.severity === 'medium' ? 'text-amber-500' : 'text-green-500'}`} />
                            </div>
                            <Progress value={report.score} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(report.checkedAt), 'dd/MM/yyyy', { locale: vi })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.checker.fullName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(report)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Báo cáo Đạo văn</DialogTitle>
            <DialogDescription>
              {selectedReport?.article.submission.title}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Score Summary */}
              <Card className={`border-2 ${getScoreConfig(selectedReport.score).color}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Độ tương đồng</p>
                      <p className="text-4xl font-bold">{selectedReport.score.toFixed(1)}%</p>
                      <Badge className={`mt-2 ${getScoreConfig(selectedReport.score).color}`}>
                        {getScoreConfig(selectedReport.score).label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Phương pháp</p>
                      <Badge variant="outline" className="text-lg">
                        {selectedReport.method}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        Kiểm tra: {format(new Date(selectedReport.checkedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bởi: {selectedReport.checker.fullName}
                      </p>
                    </div>
                  </div>
                  <Progress value={selectedReport.score} className="h-3 mt-4" />
                </CardContent>
              </Card>

              {/* Matches */}
              {selectedReport.matches && selectedReport.matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tài liệu Tương tự Tìm thấy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReport.matches.map((match: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{match.title || `Tài liệu ${idx + 1}`}</p>
                              {match.author && (
                                <p className="text-sm text-gray-600">Tác giả: {match.author}</p>
                              )}
                              {match.source && (
                                <p className="text-xs text-gray-500">Nguồn: {match.source}</p>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {match.similarity || '0'}% tương đồng
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedReport.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ghi chú</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{selectedReport.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Khuyến nghị
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedReport.score >= 70 && (
                      <>
                        <li className="text-red-600 font-semibold">Độ tương đồng rất cao - Cần xem xét từ chối</li>
                        <li>Kiểm tra kỹ nguồn trích dẫn và tham khảo</li>
                        <li>Liên hệ tác giả để làm rõ</li>
                      </>
                    )}
                    {selectedReport.score >= 40 && selectedReport.score < 70 && (
                      <>
                        <li className="text-orange-600 font-semibold">Độ tương đồng cao - Cần làm rõ</li>
                        <li>Yêu cầu tác giả bổ sung trích dẫn</li>
                        <li>Xem xét chỉnh sửa nội dung</li>
                      </>
                    )}
                    {selectedReport.score >= 20 && selectedReport.score < 40 && (
                      <>
                        <li className="text-amber-600">Độ tương đồng trung bình - Theo dõi</li>
                        <li>Kiểm tra các đoạn trùng lặp</li>
                      </>
                    )}
                    {selectedReport.score < 20 && (
                      <>
                        <li className="text-green-600 font-semibold">Độ tương đồng thấp - Chấp nhận được</li>
                        <li>Bài viết đáp ứng tiêu chuẩn tính nguyên gốc</li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
