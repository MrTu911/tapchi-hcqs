
/**
 * ORCID Connect Button Component
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ExternalLink, CheckCircle2 } from 'lucide-react'

interface ORCIDConnectProps {
  isConnected?: boolean
  orcidId?: string
}

export function ORCIDConnectButton({ isConnected, orcidId }: ORCIDConnectProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/orcid')
      if (!response.ok) throw new Error('Failed to get ORCID auth URL')

      const data = await response.json()
      window.location.href = data.authUrl
    } catch (error) {
      toast.error('Không thể kết nối với ORCID')
      setLoading(false)
    }
  }

  if (isConnected && orcidId) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Đã kết nối
        </Badge>
        <span className="text-sm text-muted-foreground">ORCID: {orcidId}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`https://orcid.org/${orcidId}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleConnect} disabled={loading} variant="outline">
      <svg
        className="h-4 w-4 mr-2"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#A6CE39"
          d="M256 128c0 70.7-57.3 128-128 128S0 198.7 0 128 57.3 0 128 0s128 57.3 128 128z"
        />
        <path
          fill="#FFF"
          d="M86.3 186.2H70.9V79.1h15.4v107.1zM108.9 79.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7C191.7 111.2 178 93 148 93h-23.7v79.4zM88.7 56.8c0 5.5-4.5 10.1-10.1 10.1s-10.1-4.6-10.1-10.1c0-5.6 4.5-10.1 10.1-10.1s10.1 4.6 10.1 10.1z"
        />
      </svg>
      {loading ? 'Đang kết nối...' : 'Kết nối ORCID'}
    </Button>
  )
}
