
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  step: string
  label: string
  status: 'completed' | 'current' | 'pending'
  date?: string
  description?: string
  details?: any
}

interface SubmissionStatusPipelineProps {
  submissionId: string
}

export function SubmissionStatusPipeline({ submissionId }: SubmissionStatusPipelineProps) {
  const [loading, setLoading] = useState(true)
  const [pipeline, setPipeline] = useState<WorkflowStep[]>([])
  const [submission, setSubmission] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [submissionId])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/submissions/${submissionId}/status`)
      const data = await res.json()

      if (data.success) {
        setPipeline(data.data.pipeline || [])
        setSubmission(data.data.submission || null)
      } else {
        setError(data.error || 'Không thể tải trạng thái')
      }
    } catch (err) {
      setError('Có lỗi xảy ra')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case 'current':
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
      case 'pending':
        return <Circle className="h-6 w-6 text-gray-300" />
      default:
        return <AlertCircle className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300'
      case 'current':
        return 'bg-blue-100 border-blue-300'
      case 'pending':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiến trình xử lý bài viết</CardTitle>
        <CardDescription>
          Mã bài: <span className="font-semibold">{submission?.code}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gray-200" />

          {/* Steps */}
          <div className="space-y-6">
            {pipeline.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Icon */}
                <div className="absolute left-0 top-0 z-10 bg-white">
                  {getStatusIcon(step.status)}
                </div>

                {/* Content */}
                <div className="ml-12">
                  <div
                    className={cn(
                      'border rounded-lg p-4 transition-all',
                      getStatusColor(step.status),
                      step.status === 'current' && 'shadow-md'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-base">{step.label}</h4>
                      {step.date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(step.date).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    {step.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {step.description}
                      </p>
                    )}

                    {/* Details */}
                    {step.details && (
                      <div className="mt-3 space-y-2">
                        {/* Author info */}
                        {step.details.author && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Tác giả:</span>{' '}
                            <span className="font-medium">{step.details.author}</span>
                          </div>
                        )}

                        {/* Category */}
                        {step.details.category && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Chuyên mục:</span>{' '}
                            <span className="font-medium">{step.details.category}</span>
                          </div>
                        )}

                        {/* Reviewers */}
                        {step.details.reviewers && step.details.reviewers.length > 0 && (
                          <div className="text-xs space-y-1">
                            <span className="text-muted-foreground">Phản biện viên:</span>
                            {step.details.reviewers.map((reviewer: any, idx: number) => (
                              <div key={idx} className="ml-2 flex items-center justify-between">
                                <span className="font-medium">{reviewer.name}</span>
                                <Badge
                                  variant={
                                    reviewer.status === 'Đã hoàn thành' ? 'success' : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {reviewer.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Editors */}
                        {step.details.editors && step.details.editors.length > 0 && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Biên tập viên:</span>
                            {step.details.editors.map((editor: any, idx: number) => (
                              <div key={idx} className="ml-2">
                                {editor.name} ({editor.role})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
