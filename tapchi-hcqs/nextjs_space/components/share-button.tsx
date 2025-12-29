
'use client'

import { Button } from '@/components/ui/button'
import { Share } from 'lucide-react'

interface ShareButtonProps {
  title: string
  text?: string
}

export function ShareButton({ title, text }: ShareButtonProps) {
  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || '',
          url
        })
      } catch (err) {
        // User cancelled share or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        alert('Đã sao chép link bài viết vào clipboard!')
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <Button variant="outline" onClick={handleShare}>
      <Share className="h-4 w-4 mr-2" />
      Chia sẻ
    </Button>
  )
}
