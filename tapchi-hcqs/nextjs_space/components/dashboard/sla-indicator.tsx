
'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SLAIndicatorProps {
  status: string;
  daysInCurrentStatus: number;
  isOverdue: boolean;
}

export default function SLAIndicator({ status, daysInCurrentStatus, isOverdue }: SLAIndicatorProps) {
  // Define SLA thresholds
  const SLA_LIMITS: Record<string, number> = {
    'NEW': 7,
    'UNDER_REVIEW': 21,
    'REVISION': 14,
    'ACCEPTED': 30,
    'IN_PRODUCTION': 14
  };

  const slaLimit = SLA_LIMITS[status];
  if (!slaLimit) return null;

  const percentage = (daysInCurrentStatus / slaLimit) * 100;
  
  let variant: 'default' | 'secondary' | 'destructive' = 'default';
  let Icon = Clock;
  let label = 'Đúng hạn';
  
  if (isOverdue || percentage >= 100) {
    variant = 'destructive';
    Icon = AlertTriangle;
    label = 'Quá hạn';
  } else if (percentage >= 80) {
    variant = 'secondary';
    Icon = Clock;
    label = 'Sắp hết hạn';
  } else {
    variant = 'default';
    Icon = CheckCircle;
    label = 'Đúng hạn';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={variant} className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {daysInCurrentStatus} / {slaLimit} ngày
          </p>
          <p className="text-xs text-muted-foreground">
            {percentage.toFixed(0)}% SLA
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
