
"use client"

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Eye,
  FileText,
  Send,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react'

interface StatusBadgeProps {
  status: string
  showIcon?: boolean
  className?: string
  pulse?: boolean
}

const statusConfig: Record<string, {
  label: string
  icon: any
  color: string
  bgColor: string
  textColor: string
}> = {
  PENDING: {
    label: 'Chờ xử lý',
    icon: Clock,
    color: 'border-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    textColor: 'text-amber-700 dark:text-amber-300'
  },
  UNDER_REVIEW: {
    label: 'Đang phản biện',
    icon: Eye,
    color: 'border-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  REVISION_REQUESTED: {
    label: 'Yêu cầu chỉnh sửa',
    icon: AlertCircle,
    color: 'border-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    textColor: 'text-orange-700 dark:text-orange-300'
  },
  REVISION_SUBMITTED: {
    label: 'Đã gửi bản chỉnh sửa',
    icon: Send,
    color: 'border-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    textColor: 'text-indigo-700 dark:text-indigo-300'
  },
  ACCEPTED: {
    label: 'Chấp nhận',
    icon: ThumbsUp,
    color: 'border-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    textColor: 'text-green-700 dark:text-green-300'
  },
  PUBLISHED: {
    label: 'Đã xuất bản',
    icon: CheckCircle,
    color: 'border-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    textColor: 'text-emerald-700 dark:text-emerald-300'
  },
  REJECTED: {
    label: 'Từ chối',
    icon: XCircle,
    color: 'border-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    textColor: 'text-red-700 dark:text-red-300'
  },
  WITHDRAWN: {
    label: 'Rút bài',
    icon: AlertTriangle,
    color: 'border-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    textColor: 'text-gray-700 dark:text-gray-300'
  },
  PROCESSING: {
    label: 'Đang xử lý',
    icon: Loader2,
    color: 'border-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    textColor: 'text-purple-700 dark:text-purple-300'
  },
  COPYEDITING: {
    label: 'Biên tập',
    icon: FileText,
    color: 'border-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    textColor: 'text-teal-700 dark:text-teal-300'
  }
}

export function StatusBadge({ status, showIcon = true, className, pulse = false }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    icon: AlertCircle,
    color: 'border-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    textColor: 'text-gray-700 dark:text-gray-300'
  }

  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'relative border-2 font-semibold',
        config.color,
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {pulse && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            status === 'PENDING' && "bg-amber-400",
            status === 'UNDER_REVIEW' && "bg-blue-400",
            status === 'REVISION_REQUESTED' && "bg-orange-400"
          )}></span>
          <span className={cn(
            "relative inline-flex rounded-full h-3 w-3",
            status === 'PENDING' && "bg-amber-500",
            status === 'UNDER_REVIEW' && "bg-blue-500",
            status === 'REVISION_REQUESTED' && "bg-orange-500"
          )}></span>
        </span>
      )}
      {showIcon && (
        <Icon className={cn(
          "h-3.5 w-3.5 mr-1.5",
          status === 'PROCESSING' && "animate-spin"
        )} />
      )}
      {config.label}
    </Badge>
  )
}

// Deadline warning badge
interface DeadlineBadgeProps {
  deadline: string
  className?: string
}

export function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary'
  let icon = Clock
  let label = `Còn ${daysLeft} ngày`
  
  if (daysLeft < 0) {
    variant = 'destructive'
    icon = AlertTriangle
    label = `Quá hạn ${Math.abs(daysLeft)} ngày`
  } else if (daysLeft <= 3) {
    variant = 'destructive'
    icon = AlertCircle
  } else if (daysLeft <= 7) {
    variant = 'default'
    icon = AlertCircle
  }
  
  const Icon = icon
  
  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}
