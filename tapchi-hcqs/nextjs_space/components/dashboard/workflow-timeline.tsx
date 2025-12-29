
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  UserCheck,
  AlertCircle,
  Calendar,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TimelineEvent {
  type: string;
  timestamp: string;
  actor?: string;
  description: string;
  status?: string;
  decision?: string;
  recommendation?: string;
  details?: string;
  note?: string;
  dueDate?: string;
  isOverdue?: boolean;
  completed?: string;
}

interface WorkflowTimelineProps {
  submissionId: string;
}

export default function WorkflowTimeline({ submissionId }: WorkflowTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [submissionId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/timeline?submissionId=${submissionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch timeline');
      }

      setTimeline(data.data.timeline);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SUBMISSION_CREATED':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'REVIEW_INVITED':
        return <Send className="w-5 h-5 text-purple-500" />;
      case 'REVIEW_ACCEPTED':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'REVIEW_DECLINED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'REVIEW_COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'EDITOR_DECISION':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'DEADLINE_SET':
        return <Calendar className="w-5 h-5 text-yellow-500" />;
      case 'VERSION_UPDATED':
        return <Edit className="w-5 h-5 text-indigo-500" />;
      case 'STATUS_CHANGE':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      REVISION: 'bg-orange-100 text-orange-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      IN_PRODUCTION: 'bg-purple-100 text-purple-800',
      PUBLISHED: 'bg-emerald-100 text-emerald-800'
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiến trình biên tập</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          {timeline.map((event, index) => (
            <div key={index} className="relative flex gap-4 pl-12">
              {/* Icon */}
              <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-border">
                {getEventIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{event.description}</p>
                    {event.actor && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {event.actor}
                      </p>
                    )}
                    {event.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.details}
                      </p>
                    )}
                    {event.note && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Ghi chú: {event.note}
                      </p>
                    )}
                    {event.recommendation && (
                      <div className="mt-1">
                        <Badge variant="outline">
                          Đề xuất: {event.recommendation}
                        </Badge>
                      </div>
                    )}
                    {event.decision && (
                      <div className="mt-1">
                        <Badge variant="outline">
                          Quyết định: {event.decision}
                        </Badge>
                      </div>
                    )}
                    {event.dueDate && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm">
                          Hạn: {format(new Date(event.dueDate), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                        {event.isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Quá hạn
                          </Badge>
                        )}
                        {event.completed && (
                          <Badge variant="outline" className="text-xs">
                            Đã hoàn thành
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </span>
                    {event.status && getStatusBadge(event.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {timeline.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Chưa có sự kiện nào
          </p>
        )}
      </CardContent>
    </Card>
  );
}
