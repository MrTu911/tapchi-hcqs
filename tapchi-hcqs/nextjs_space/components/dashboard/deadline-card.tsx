
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

interface DeadlineCardProps {
  deadline: {
    id: string;
    type: string;
    dueDate: Date | string;
    isOverdue: boolean;
    completedAt: Date | string | null;
    submission: {
      id: string;
      code: string;
      title: string;
      status: string;
    };
  };
  onComplete?: (deadlineId: string) => void;
}

export default function DeadlineCard({ deadline, onComplete }: DeadlineCardProps) {
  const dueDate = new Date(deadline.dueDate);
  const now = new Date();
  const isUpcoming = dueDate > now && (dueDate.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;

  const typeLabels: Record<string, string> = {
    INITIAL_REVIEW: 'Phản biện ban đầu',
    REVISION_SUBMIT: 'Nộp bản sửa',
    RE_REVIEW: 'Phản biện lại',
    EDITOR_DECISION: 'Quyết định biên tập',
    PRODUCTION: 'Sản xuất/Dàn trang',
    PUBLICATION: 'Xuất bản'
  };

  return (
    <Card className={`
      ${deadline.isOverdue ? 'border-red-500 bg-red-50/50' : ''}
      ${isUpcoming ? 'border-yellow-500 bg-yellow-50/50' : ''}
      ${deadline.completedAt ? 'opacity-60' : ''}
    `}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Type and Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                {typeLabels[deadline.type] || deadline.type}
              </Badge>
              {deadline.isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Quá hạn
                </Badge>
              )}
              {isUpcoming && !deadline.isOverdue && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Sắp đến hạn
                </Badge>
              )}
              {deadline.completedAt && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Đã hoàn thành
                </Badge>
              )}
            </div>

            {/* Submission info */}
            <div>
              <Link 
                href={`/dashboard/editor/submissions/${deadline.submission.id}`}
                className="font-medium hover:underline"
              >
                {deadline.submission.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                Mã: {deadline.submission.code}
              </p>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                Hạn: {dueDate.toLocaleDateString('vi-VN')}
              </span>
              <span className="text-muted-foreground">
                ({formatDistanceToNow(dueDate, { addSuffix: true, locale: vi })})
              </span>
            </div>
          </div>

          {/* Actions */}
          {!deadline.completedAt && onComplete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onComplete(deadline.id)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Hoàn thành
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
