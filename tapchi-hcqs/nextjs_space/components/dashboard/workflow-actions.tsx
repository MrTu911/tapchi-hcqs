
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Send,
  CheckCircle,
  XCircle,
  Edit,
  FileText,
  AlertCircle
} from 'lucide-react';

interface WorkflowActionsProps {
  submissionId: string;
  currentStatus: string;
  userRole: string;
}

interface Action {
  action: string;
  label: string;
  status: string;
  icon: any;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresNote?: boolean;
}

export default function WorkflowActions({
  submissionId,
  currentStatus,
  userRole
}: WorkflowActionsProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const availableActions: Action[] = getAvailableActions(currentStatus, userRole);

  function getAvailableActions(status: string, role: string): Action[] {
    const actions: Action[] = [];

    const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(role);
    const isManaging = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(role);
    const isEIC = ['EIC', 'SYSADMIN'].includes(role);

    switch (status) {
      case 'NEW':
        if (isEditor) {
          actions.push({
            action: 'send_to_review',
            label: 'Gửi phản biện',
            status: 'UNDER_REVIEW',
            icon: Send,
            variant: 'default'
          });
          actions.push({
            action: 'desk_reject',
            label: 'Từ chối ngay',
            status: 'DESK_REJECT',
            icon: XCircle,
            variant: 'destructive',
            requiresNote: true
          });
        }
        break;

      case 'UNDER_REVIEW':
        if (isEditor) {
          actions.push({
            action: 'request_revision',
            label: 'Yêu cầu chỉnh sửa',
            status: 'REVISION',
            icon: Edit,
            variant: 'secondary',
            requiresNote: true
          });
        }
        if (isManaging) {
          actions.push({
            action: 'accept',
            label: 'Chấp nhận',
            status: 'ACCEPTED',
            icon: CheckCircle,
            variant: 'default'
          });
        }
        if (isEditor) {
          actions.push({
            action: 'reject',
            label: 'Từ chối',
            status: 'REJECTED',
            icon: XCircle,
            variant: 'destructive',
            requiresNote: true
          });
        }
        break;

      case 'REVISION':
        if (isEditor) {
          actions.push({
            action: 'send_to_review',
            label: 'Gửi phản biện lại',
            status: 'UNDER_REVIEW',
            icon: Send,
            variant: 'default'
          });
          actions.push({
            action: 'reject',
            label: 'Từ chối',
            status: 'REJECTED',
            icon: XCircle,
            variant: 'destructive',
            requiresNote: true
          });
        }
        break;

      case 'ACCEPTED':
        if (isManaging) {
          actions.push({
            action: 'start_production',
            label: 'Bắt đầu sản xuất',
            status: 'IN_PRODUCTION',
            icon: FileText,
            variant: 'default'
          });
        }
        break;

      case 'IN_PRODUCTION':
        if (isEIC) {
          actions.push({
            action: 'publish',
            label: 'Xuất bản',
            status: 'PUBLISHED',
            icon: CheckCircle,
            variant: 'default'
          });
        }
        break;
    }

    return actions;
  }

  const handleActionClick = (action: Action) => {
    setSelectedAction(action);
    setNote('');
    setShowDialog(true);
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;

    if (selectedAction.requiresNote && !note.trim()) {
      toast.error('Vui lòng nhập ghi chú');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action: selectedAction.action,
          newStatus: selectedAction.status,
          note: note.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute action');
      }

      toast.success('Thực hiện thành công!');
      setShowDialog(false);
      router.refresh();

    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.action}
              variant={action.variant || 'default'}
              onClick={() => handleActionClick(action)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hành động</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn {selectedAction?.label.toLowerCase()}?
            </DialogDescription>
          </DialogHeader>

          {selectedAction?.requiresNote && (
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú *</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lý do hoặc ghi chú..."
                rows={4}
              />
            </div>
          )}

          {!selectedAction?.requiresNote && (
            <div className="space-y-2">
              <Label htmlFor="optional-note">Ghi chú (tuỳ chọn)</Label>
              <Textarea
                id="optional-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú nếu cần..."
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              variant={selectedAction?.variant === 'destructive' ? 'destructive' : 'default'}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
