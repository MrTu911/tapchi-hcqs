
/**
 * AI Reviewer Matching Component
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Sparkles, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'

interface ReviewerMatchProps {
  submissionId: string
  onSelect?: (reviewerId: string) => void
}

export function ReviewerMatchCard({ submissionId, onSelect }: ReviewerMatchProps) {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const findMatches = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reviewers/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, topN: 5 })
      })

      if (!response.ok) throw new Error('Failed to find matches')

      const data = await response.json()
      setMatches(data.matches)
      toast.success(`Tìm thấy ${data.matches.length} phản biện viên phù hợp`)
    } catch (error) {
      toast.error('Không thể tìm phản biện viên phù hợp')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50'
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Reviewer Matching
        </CardTitle>
        <CardDescription>
          Gợi ý phản biện viên phù hợp dựa trên chuyên môn và từ khóa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Chưa có kết quả gợi ý. Nhấn nút bên dưới để tìm phản biện viên phù hợp.
            </p>
            <Button onClick={findMatches} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? 'Đang tìm...' : 'Tìm phản biện viên'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Avatar>
                  <AvatarFallback>
                    {match.reviewer.fullName
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{match.reviewer.fullName}</h4>
                    <Badge className={getScoreColor(match.score)}>
                      {(match.score * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {match.reviewer.org}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Chuyên môn: {(match.breakdown.expertiseMatch * 100).toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Từ khóa: {(match.breakdown.keywordMatch * 100).toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Khả dụng: {(match.breakdown.availabilityScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  {match.reviewer.reviewerProfile?.expertise && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {match.reviewer.reviewerProfile.expertise
                        .slice(0, 3)
                        .map((exp: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>

                {onSelect && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(match.reviewerId)}
                  >
                    Chọn
                  </Button>
                )}
              </div>
            ))}

            <Button variant="ghost" size="sm" onClick={findMatches} disabled={loading}>
              Làm mới gợi ý
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
