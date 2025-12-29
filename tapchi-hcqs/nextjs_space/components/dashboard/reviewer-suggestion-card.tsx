
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, UserPlus, Mail } from 'lucide-react'

interface ReviewerSuggestion {
  userId: string
  userName: string
  email: string
  score: number
  expertise: string[]
  currentWorkload: number
  averageRating: number
  reasons: string[]
}

interface ReviewerSuggestionCardProps {
  reviewer: ReviewerSuggestion
  onInvite?: (userId: string) => void
  selected?: boolean
}

export function ReviewerSuggestionCard({ 
  reviewer, 
  onInvite,
  selected = false
}: ReviewerSuggestionCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <Card className={selected ? 'border-2 border-blue-500' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(reviewer.userName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{reviewer.userName}</h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{reviewer.email}</span>
                </div>
              </div>
              
              <Badge 
                className={`ml-2 ${getScoreColor(reviewer.score)}`}
                variant="secondary"
              >
                {reviewer.score} điểm
              </Badge>
            </div>
            
            {reviewer.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {reviewer.expertise.slice(0, 3).map((exp, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {exp}
                  </Badge>
                ))}
                {reviewer.expertise.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{reviewer.expertise.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{reviewer.averageRating > 0 ? reviewer.averageRating.toFixed(1) : 'N/A'}</span>
              </div>
              <div>
                Workload: <span className={reviewer.currentWorkload === 0 ? 'text-green-600 font-medium' : ''}>
                  {reviewer.currentWorkload}
                </span>
              </div>
            </div>
            
            {reviewer.reasons.length > 0 && (
              <div className="mb-3">
                <ul className="text-xs space-y-1">
                  {reviewer.reasons.slice(0, 2).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-muted-foreground">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {onInvite && (
              <Button
                size="sm"
                onClick={() => onInvite(reviewer.userId)}
                disabled={selected}
                className="w-full"
                variant={selected ? 'secondary' : 'default'}
              >
                {selected ? (
                  <>Đã chọn</>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Mời phản biện
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
