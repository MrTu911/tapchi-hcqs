
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ReviewerSuggestionDialog } from './reviewer-suggestion-dialog'

interface AssignReviewersFormProps {
  submission: any
  reviewers: any[]
  currentReviewerIds: string[]
}

export default function AssignReviewersForm({ 
  submission, 
  reviewers,
  currentReviewerIds 
}: AssignReviewersFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>(currentReviewerIds)
  const [showAISuggestion, setShowAISuggestion] = useState(false)

  const handleToggleReviewer = (reviewerId: string) => {
    setSelectedReviewers(prev => {
      if (prev.includes(reviewerId)) {
        return prev.filter(id => id !== reviewerId)
      } else {
        return [...prev, reviewerId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedReviewers.length < 2) {
      toast.error('Vui lòng chọn ít nhất 2 phản biện viên')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/submissions/${submission.id}/assign-reviewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewerIds: selectedReviewers
        })
      })

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi gán phản biện')
      }

      toast.success('Gán phản biện viên thành công!')
      router.push('/dashboard/editor')
      router.refresh()
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAIAssign = async (reviewerIds: string[]) => {
    setSelectedReviewers(prev => {
      const newSet = new Set([...prev, ...reviewerIds])
      return Array.from(newSet)
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Đã chọn: <strong>{selectedReviewers.length}</strong> phản biện viên
              {selectedReviewers.length < 2 && (
                <span className="text-destructive ml-2">(Cần chọn ít nhất 2)</span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAISuggestion(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              Gợi ý AI
            </Button>
          </div>

        <div className="grid gap-4">
          {reviewers.map((reviewer) => {
            const isSelected = selectedReviewers.includes(reviewer.id)
            const isCurrent = currentReviewerIds.includes(reviewer.id)

            return (
              <div 
                key={reviewer.id}
                className={`flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <Checkbox
                  id={reviewer.id}
                  checked={isSelected}
                  onCheckedChange={() => handleToggleReviewer(reviewer.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label 
                      htmlFor={reviewer.id} 
                      className="font-medium cursor-pointer"
                    >
                      {reviewer.fullName}
                    </Label>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã gán
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {reviewer.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reviewer.email}
                    {reviewer.org && ` • ${reviewer.org}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Đã phản biện: {reviewer._count.reviews} bài
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

        <div className="flex items-center gap-3">
          <Button 
            type="submit" 
            disabled={isSubmitting || selectedReviewers.length < 2}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentReviewerIds.length > 0 ? 'Cập nhật phản biện viên' : 'Gán phản biện viên'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Hủy
          </Button>
        </div>
      </form>

      <ReviewerSuggestionDialog
        open={showAISuggestion}
        onClose={() => setShowAISuggestion(false)}
        submissionId={submission.id}
        submissionTitle={submission.title}
        onAssign={handleAIAssign}
      />
    </>
  )
}
