
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Globe, School, Shield } from 'lucide-react'

const quickLinks = [
  {
    title: 'Bộ Quốc phòng',
    url: '#',
    icon: Shield
  },
  {
    title: 'Học viện Hậu cần',
    url: '#',
    icon: School
  },
  {
    title: 'Tạp chí Quốc phòng toàn dân',
    url: '#',
    icon: Globe
  }
]

export function QuickLinksWidget() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <ExternalLink className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Liên kết nhanh</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon
            return (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group border"
              >
                <div className="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium flex-1 line-clamp-1">
                  {link.title}
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
