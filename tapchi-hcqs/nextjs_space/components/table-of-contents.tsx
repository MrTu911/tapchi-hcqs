
"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { List, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Heading {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from the article content
    const articleContent = document.querySelector('.article-content')
    if (!articleContent) return

    const headingElements = articleContent.querySelectorAll('h2, h3')
    const headingsList: Heading[] = []

    headingElements.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`
      if (!heading.id) {
        heading.id = id
      }

      headingsList.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.substring(1)),
      })
    })

    setHeadings(headingsList)

    // Set up Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -80% 0px' }
    )

    headingElements.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offsetTop = element.offsetTop - 100
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      })
    }
  }

  if (headings.length === 0) return null

  return (
    <Card className="p-6 sticky top-24">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <List className="h-5 w-5 text-emerald-700" />
        <h3 className="font-semibold text-emerald-900">Mục lục</h3>
      </div>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={cn(
              'w-full text-left text-sm py-2 px-3 rounded-lg transition-all hover:bg-emerald-50 group flex items-start gap-2',
              heading.level === 3 && 'pl-6',
              activeId === heading.id
                ? 'bg-emerald-50 text-emerald-900 font-medium'
                : 'text-gray-600 hover:text-emerald-800'
            )}
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 mt-0.5 flex-shrink-0 transition-transform',
                activeId === heading.id
                  ? 'text-emerald-600 transform rotate-90'
                  : 'text-gray-400 group-hover:text-emerald-600'
              )}
            />
            <span className="line-clamp-2">{heading.text}</span>
          </button>
        ))}
      </nav>
    </Card>
  )
}
