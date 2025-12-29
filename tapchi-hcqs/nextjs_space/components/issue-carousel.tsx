
"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Issue {
  id: string
  number: number
  year: number
  coverImage?: string
  volume?: {
    volumeNo: number
  }
}

interface IssueCarouselProps {
  issues: Issue[]
}

export function IssueCarousel({ issues }: IssueCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (issues.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % issues.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [issues.length])

  if (!isClient || issues.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Đang tải số báo...
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentIssue = issues[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + issues.length) % issues.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % issues.length)
  }

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-0">
        <div className="relative">
          {/* Cover Image */}
          <Link href={`/issues/${currentIssue.id}`} className="block group">
            <div className="relative aspect-[3/4] bg-muted overflow-hidden">
              {currentIssue.coverImage ? (
                <Image
                  src={currentIssue.coverImage}
                  alt={`Số ${currentIssue.number}/${currentIssue.year}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 flex items-center justify-center">
                  <BookOpen className="h-20 w-20 text-muted-foreground opacity-30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </Link>

          {/* Navigation Arrows */}
          {issues.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full shadow-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full shadow-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Issue Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
            <p className="text-sm font-medium">
              Tập {currentIssue.volume?.volumeNo || currentIssue.year}
            </p>
            <p className="text-lg font-bold">
              Số {currentIssue.number} ({currentIssue.year})
            </p>
          </div>

          {/* Dots Indicator */}
          {issues.length > 1 && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
              {issues.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
