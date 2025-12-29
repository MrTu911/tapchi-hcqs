
"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, Quote, Download } from 'lucide-react'
import { toast } from 'sonner'

interface CitationBoxProps {
  article: {
    title: string
    authors: string
    year: string
    volume?: string
    issue?: string
    pages?: string
    doi?: string
    journal?: string
    url?: string
  }
}

type CitationFormat = 'APA' | 'MLA' | 'IEEE' | 'BibTeX'

export function CitationBox({ article }: CitationBoxProps) {
  const [copied, setCopied] = useState<CitationFormat | null>(null)
  const journalName = article.journal || 'Tạp chí Khoa học Hậu cần Quân sự'
  const journalShort = 'TCKHHCQS'

  // Generate citations
  const apaCitation = `${article.authors} (${article.year}). ${article.title}. ${journalName}${article.volume ? `, ${article.volume}` : ''}${article.issue ? `(${article.issue})` : ''}${article.pages ? `, ${article.pages}` : ''}.${article.doi ? ` https://doi.org/${article.doi}` : ''}`

  const mlaCitation = `${article.authors}. "${article.title}." ${journalName}${article.volume ? ` ${article.volume}` : ''}${article.issue ? `.${article.issue}` : ''} (${article.year})${article.pages ? `: ${article.pages}` : ''}.${article.doi ? ` https://doi.org/${article.doi}` : ''}`

  const ieeeCitation = `${article.authors}, "${article.title}," ${journalName}${article.volume ? `, vol. ${article.volume}` : ''}${article.issue ? `, no. ${article.issue}` : ''}${article.pages ? `, pp. ${article.pages}` : ''}${article.year ? `, ${article.year}` : ''}.${article.doi ? ` doi: ${article.doi}` : ''}`

  // BibTeX format
  const bibtexKey = `${article.authors.split(',')[0].trim().toLowerCase().replace(/\s+/g, '')}${article.year}`
  const bibtexCitation = `@article{${bibtexKey},
  author  = {${article.authors}},
  title   = {${article.title}},
  journal = {${journalName}},${article.volume ? `\n  volume  = {${article.volume}},` : ''}${article.issue ? `\n  number  = {${article.issue}},` : ''}${article.pages ? `\n  pages   = {${article.pages}},` : ''}
  year    = {${article.year}},${article.doi ? `\n  doi     = {${article.doi}},` : ''}${article.url ? `\n  url     = {${article.url}}` : ''}
}`

  const copyToClipboard = async (text: string, format: CitationFormat) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(format)
      setTimeout(() => setCopied(null), 2000)
      toast.success(`Đã sao chép trích dẫn ${format}`)
    } catch (error) {
      toast.error('Không thể sao chép. Vui lòng thử lại.')
    }
  }

  const downloadBibTeX = () => {
    const blob = new Blob([bibtexCitation], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bibtexKey}.bib`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Đã tải xuống file BibTeX')
  }

  const renderCitation = (format: CitationFormat, citation: string) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{format}</span>
        <div className="flex gap-2">
          {format === 'BibTeX' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={downloadBibTeX}
              className="h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Tải xuống</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(citation, format)}
            className="h-8"
          >
            {copied === format ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                <span className="text-xs text-green-600">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Sao chép</span>
              </>
            )}
          </Button>
        </div>
      </div>
      <div className={`text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-amber-100 ${format === 'BibTeX' ? 'font-mono' : ''}`}>
        {format === 'BibTeX' ? (
          <pre className="whitespace-pre-wrap text-xs overflow-x-auto">{citation}</pre>
        ) : (
          <p>{citation}</p>
        )}
      </div>
    </div>
  )

  return (
    <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200">
        <Quote className="h-5 w-5 text-amber-700" />
        <h3 className="font-semibold text-amber-900">Trích dẫn</h3>
      </div>

      <Tabs defaultValue="apa" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="apa">APA</TabsTrigger>
          <TabsTrigger value="mla">MLA</TabsTrigger>
          <TabsTrigger value="ieee">IEEE</TabsTrigger>
          <TabsTrigger value="bibtex">BibTeX</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apa">
          {renderCitation('APA', apaCitation)}
        </TabsContent>
        
        <TabsContent value="mla">
          {renderCitation('MLA', mlaCitation)}
        </TabsContent>
        
        <TabsContent value="ieee">
          {renderCitation('IEEE', ieeeCitation)}
        </TabsContent>
        
        <TabsContent value="bibtex">
          {renderCitation('BibTeX', bibtexCitation)}
        </TabsContent>
      </Tabs>

      <div className="mt-4 pt-4 border-t border-amber-200">
        <p className="text-xs text-gray-600">
          💡 <span className="font-medium">Mẹo:</span> Chọn định dạng phù hợp với tạp chí bạn đang nộp bài. 
          BibTeX phù hợp với LaTeX, IEEE cho kỹ thuật, APA cho khoa học xã hội.
        </p>
      </div>
    </Card>
  )
}
