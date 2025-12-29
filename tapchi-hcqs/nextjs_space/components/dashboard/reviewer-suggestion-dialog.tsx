
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, 
  TrendingUp, 
  Clock, 
  Award, 
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewerSuggestion {
  id: string;
  userId: string;
  name: string;
  email: string;
  matchScore: number;
  expertise: string[];
  keywords: string[];
  currentLoad: number;
  available: boolean;
  avgCompletionDays: number;
  averageRating: number;
  totalReviews: number;
  lastReviewAt: Date | null;
}

interface ReviewerSuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  submissionTitle: string;
  onAssign: (reviewerIds: string[]) => Promise<void>;
}

export function ReviewerSuggestionDialog({
  open,
  onClose,
  submissionId,
  submissionTitle,
  onAssign
}: ReviewerSuggestionDialogProps) {
  const [suggestions, setSuggestions] = useState<ReviewerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open && submissionId) {
      fetchSuggestions();
    }
  }, [open, submissionId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reviewers/suggest?submissionId=${submissionId}&limit=10&minMatchScore=0.1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.data.suggestions);
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      toast.error('Không thể tải danh sách gợi ý reviewer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReviewer = (userId: string) => {
    const newSelected = new Set(selectedReviewers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedReviewers(newSelected);
  };

  const handleAssign = async () => {
    if (selectedReviewers.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 reviewer');
      return;
    }

    try {
      setAssigning(true);
      await onAssign(Array.from(selectedReviewers));
      toast.success(`Đã gán ${selectedReviewers.size} reviewer thành công`);
      setSelectedReviewers(new Set());
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Không thể gán reviewer');
    } finally {
      setAssigning(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.4) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 0.7) return 'Rất phù hợp';
    if (score >= 0.4) return 'Phù hợp';
    return 'Có thể phù hợp';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Gợi ý Reviewer AI
          </DialogTitle>
          <DialogDescription>
            Hệ thống đã phân tích và đề xuất các reviewer phù hợp nhất cho bài viết:
            <br />
            <span className="font-medium text-foreground">{submissionTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Không tìm thấy reviewer phù hợp.
                  <br />
                  Thử điều chỉnh keywords hoặc mời reviewer thủ công.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((reviewer) => (
                <Card
                  key={reviewer.userId}
                  className={`cursor-pointer transition-all ${
                    selectedReviewers.has(reviewer.userId)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleToggleReviewer(reviewer.userId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedReviewers.has(reviewer.userId)}
                        onCheckedChange={() => handleToggleReviewer(reviewer.userId)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-lg">{reviewer.name}</div>
                            <div className="text-sm text-muted-foreground">{reviewer.email}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getMatchScoreColor(reviewer.matchScore)}>
                              <Star className="h-3 w-3 mr-1" />
                              {getMatchScoreLabel(reviewer.matchScore)} ({Math.round(reviewer.matchScore * 100)}%)
                            </Badge>
                            {reviewer.currentLoad >= 5 && (
                              <Badge variant="outline" className="text-orange-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Workload cao
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Expertise & Keywords */}
                        <div className="space-y-2">
                          {reviewer.expertise.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs font-medium text-muted-foreground mr-1">
                                Chuyên môn:
                              </span>
                              {reviewer.expertise.map((exp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {exp}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {reviewer.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs font-medium text-muted-foreground mr-1">
                                Từ khóa:
                              </span>
                              {reviewer.keywords.slice(0, 5).map((kw, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                              {reviewer.keywords.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{reviewer.keywords.length - 5} khác
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>{reviewer.totalReviews} reviews</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>~{Math.round(reviewer.avgCompletionDays)} ngày</span>
                          </div>
                          
                          {reviewer.averageRating > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Award className="h-4 w-4" />
                              <span>{reviewer.averageRating.toFixed(1)}/5.0</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Load hiện tại:</span>
                            <Badge variant={reviewer.currentLoad >= 5 ? 'destructive' : 'outline'}>
                              {reviewer.currentLoad}/5
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedReviewers.size > 0 ? (
              <span className="flex items-center gap-1 text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Đã chọn {selectedReviewers.size} reviewer
              </span>
            ) : (
              <span>Chọn reviewer để gán</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={assigning}>
              Hủy
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={selectedReviewers.size === 0 || assigning}
            >
              {assigning ? 'Đang gán...' : `Gán ${selectedReviewers.size > 0 ? selectedReviewers.size : ''} Reviewer`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
