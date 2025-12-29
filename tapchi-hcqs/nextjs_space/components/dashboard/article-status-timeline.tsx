'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { statusLabels, statusColors } from '@/lib/status-tracker';
import { SubmissionStatus } from '@prisma/client';

interface StatusHistoryItem {
  id: string;
  status: SubmissionStatus;
  changedAt: string;
  notes: string | null;
  changer: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

interface ArticleStatusTimelineProps {
  history: StatusHistoryItem[];
  currentStatus: SubmissionStatus;
}

export function ArticleStatusTimeline({ history, currentStatus }: ArticleStatusTimelineProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử Trạng thái</CardTitle>
          <CardDescription>Chưa có lịch sử thay đổi</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử Trạng thái</CardTitle>
        <CardDescription>Theo dõi tiến trình xử lý bài viết</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {history.map((item, index) => {
            const isLast = index === history.length - 1;
            const isCurrent = item.status === currentStatus;
            const statusColor = statusColors[item.status];

            return (
              <div key={item.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10">
                  {isLast || isCurrent ? (
                    <CheckCircle className="w-8 h-8 text-green-600 bg-white" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-400 bg-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge className={statusColor}>
                        {statusLabels[item.status]}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="outline" className="ml-2">
                          Hiện tại
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.changedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </div>
                  </div>

                  {item.changer && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">{item.changer.fullName}</span>
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-sm text-gray-500 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
