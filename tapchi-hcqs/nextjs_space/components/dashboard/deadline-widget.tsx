'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, CheckCircle, Calendar, Eye, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

interface Deadline {
  id: string;
  type: string;
  dueDate: string;
  description: string;
  isCompleted: boolean;
  daysRemaining: number;
  status: 'overdue' | 'urgent' | 'upcoming' | 'completed';
  submission: {
    id: string;
    code: string;
    title: string;
    status: string;
    author: {
      fullName: string;
      email: string;
    };
  };
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface DeadlineSummary {
  total: number;
  overdue: number;
  urgent: number;
  upcoming: number;
  completed: number;
}

interface DeadlineWidgetProps {
  compact?: boolean;
  showCompleted?: boolean;
  maxItems?: number;
}

export default function DeadlineWidget({ 
  compact = false,
  showCompleted = false,
  maxItems = 5
}: DeadlineWidgetProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [summary, setSummary] = useState<DeadlineSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const statusParam = showCompleted ? '' : 'status=upcoming';
      const response = await fetch(`/api/deadlines?${statusParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch deadlines');
      }

      const data = await response.json();
      setDeadlines(data.data.deadlines.slice(0, maxItems));
      setSummary(data.data.summary);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      toast.error('Không thể tải deadline');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Quá hạn</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500">Khẩn cấp</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Sắp tới</Badge>;
      case 'completed':
        return <Badge variant="outline">Hoàn thành</Badge>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      EDITOR_ASSIGNMENT: 'Phân công Editor',
      REVIEW: 'Phản biện',
      REVISION: 'Chỉnh sửa',
      COPYEDIT: 'Biên tập',
      PRODUCTION: 'Sản xuất',
      PUBLICATION: 'Xuất bản'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Deadline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Deadline
            </CardTitle>
            {summary && (
              <div className="flex gap-2">
                {summary.overdue > 0 && (
                  <Badge variant="destructive">{summary.overdue}</Badge>
                )}
                {summary.urgent > 0 && (
                  <Badge className="bg-orange-500">{summary.urgent}</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {deadlines.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm">Không có deadline sắp tới</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-start gap-2 p-2 hover:bg-muted rounded-lg transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(deadline.status)}
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(deadline.type)}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{deadline.submission.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(deadline.dueDate), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                  <Link href={`/dashboard/editor/submissions/${deadline.submission.id}`}>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Deadline cần chú ý
        </CardTitle>
        <CardDescription>
          Quản lý các mốc thời gian quan trọng
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Tổng</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
              <div className="text-xs text-red-600">Quá hạn</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{summary.urgent}</div>
              <div className="text-xs text-orange-600">Khẩn</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.upcoming}</div>
              <div className="text-xs text-green-600">Sắp tới</div>
            </div>
          </div>
        )}

        {/* Overdue Alert */}
        {summary && summary.overdue > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bạn có <strong>{summary.overdue}</strong> deadline đã quá hạn cần xử lý ngay!
            </AlertDescription>
          </Alert>
        )}

        {/* Deadline List */}
        {deadlines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
            <p>Không có deadline sắp tới</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <div key={deadline.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(deadline.status)}
                      <Badge variant="outline">{getTypeLabel(deadline.type)}</Badge>
                      <Badge variant="secondary">{deadline.submission.code}</Badge>
                    </div>
                    <h4 className="font-semibold mb-1 line-clamp-1">
                      {deadline.submission.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {deadline.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(deadline.dueDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </div>
                      <div>
                        {deadline.status === 'overdue' ? (
                          <span className="text-red-600 font-medium">
                            Trễ {Math.abs(deadline.daysRemaining)} ngày
                          </span>
                        ) : (
                          <span>
                            Còn {deadline.daysRemaining} ngày
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/dashboard/editor/submissions/${deadline.submission.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {deadlines.length >= maxItems && (
          <div className="text-center">
            <Link href="/dashboard/deadlines">
              <Button variant="outline" size="sm">
                Xem tất cả deadline
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
