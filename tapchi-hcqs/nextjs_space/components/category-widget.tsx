
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, ChevronRight } from 'lucide-react'

interface CategoryWidgetProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    _count?: {
      submissions: number
    }
  }>
}

export function CategoryWidget({ categories }: CategoryWidgetProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Chuyên mục</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group"
            >
              <span className="text-sm font-medium line-clamp-1 flex-1">
                {category.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {category._count?.submissions || 0}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
        {categories.length > 8 && (
          <Link
            href="/categories"
            className="block mt-3 pt-3 border-t text-sm text-center text-primary hover:underline font-medium"
          >
            Xem tất cả chuyên mục →
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
