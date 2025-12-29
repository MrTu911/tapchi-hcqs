

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

// Export citation in various formats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json, xml, bibtex, ris

    // Fetch article with all necessary data
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            author: {
              select: {
                fullName: true,
                email: true,
                org: true
              }
            },
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        },
        issue: {
          include: {
            volume: true
          }
        }
      }
    })

    if (!article) {
      return errorResponse('Không tìm thấy bài báo', 404)
    }

    // Prepare citation data
    const citationData = {
      id: article.id,
      title: article.submission.title,
      authors: article.submission.author.fullName,
      authorEmail: article.submission.author.email,
      organization: article.submission.author.org,
      abstract: article.submission.abstractVn,
      abstractEn: article.submission.abstractEn,
      keywords: article.submission.keywords,
      category: article.submission.category?.name,
      year: article.issue?.year?.toString() || new Date(article.publishedAt || article.submission.createdAt).getFullYear().toString(),
      volume: article.issue?.volume?.volumeNo?.toString(),
      issue: article.issue?.number?.toString(),
      pages: article.pages,
      doi: article.doiLocal,
      publishedAt: article.publishedAt,
      journal: 'Tạp chí Khoa học Hậu cần Quân sự',
      journalShort: 'TCKHHCQS',
      issn: '2734-9888',
      publisher: 'Học viện Hậu cần',
      url: `${process.env.NEXTAUTH_URL || 'https://tapchinckhhcqs.abacusai.app'}/articles/${article.id}`
    }

    // Generate citation based on format
    switch (format.toLowerCase()) {
      case 'json':
        return Response.json(citationData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="citation-${article.id}.json"`
          }
        })

      case 'xml':
        const xml = generateXMLCitation(citationData)
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="citation-${article.id}.xml"`
          }
        })

      case 'bibtex':
        const bibtex = generateBibTeXCitation(citationData)
        return new Response(bibtex, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="citation-${article.id}.bib"`
          }
        })

      case 'ris':
        const ris = generateRISCitation(citationData)
        return new Response(ris, {
          headers: {
            'Content-Type': 'application/x-research-info-systems',
            'Content-Disposition': `attachment; filename="citation-${article.id}.ris"`
          }
        })

      case 'endnote':
        const endnote = generateEndNoteCitation(citationData)
        return new Response(endnote, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="citation-${article.id}.enw"`
          }
        })

      default:
        return successResponse({ citation: citationData })
    }
  } catch (error) {
    console.error('Error exporting citation:', error)
    return errorResponse('Lỗi khi xuất trích dẫn', 500)
  }
}

// Helper functions for citation formats

function generateXMLCitation(data: any): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<article>
  <id>${escapeXML(data.id)}</id>
  <title>${escapeXML(data.title)}</title>
  <authors>${escapeXML(data.authors)}</authors>
  <organization>${escapeXML(data.organization || '')}</organization>
  <abstract>${escapeXML(data.abstract || '')}</abstract>
  ${data.abstractEn ? `<abstract-en>${escapeXML(data.abstractEn)}</abstract-en>` : ''}
  <keywords>
    ${data.keywords?.map((kw: string) => `<keyword>${escapeXML(kw)}</keyword>`).join('\n    ') || ''}
  </keywords>
  <journal>
    <name>${escapeXML(data.journal)}</name>
    <short-name>${escapeXML(data.journalShort)}</short-name>
    <issn>${data.issn}</issn>
    <publisher>${escapeXML(data.publisher)}</publisher>
  </journal>
  <publication>
    <year>${data.year}</year>
    ${data.volume ? `<volume>${data.volume}</volume>` : ''}
    ${data.issue ? `<issue>${data.issue}</issue>` : ''}
    ${data.pages ? `<pages>${escapeXML(data.pages)}</pages>` : ''}
    ${data.doi ? `<doi>${escapeXML(data.doi)}</doi>` : ''}
    ${data.publishedAt ? `<published-at>${new Date(data.publishedAt).toISOString()}</published-at>` : ''}
  </publication>
  <url>${escapeXML(data.url)}</url>
  ${data.category ? `<category>${escapeXML(data.category)}</category>` : ''}
</article>`
}

function generateBibTeXCitation(data: any): string {
  const key = `${data.authors.split(',')[0].trim().toLowerCase().replace(/\s+/g, '')}${data.year}`
  return `@article{${key},
  author  = {${data.authors}},
  title   = {${data.title}},
  journal = {${data.journal}},${data.volume ? `\n  volume  = {${data.volume}},` : ''}${data.issue ? `\n  number  = {${data.issue}},` : ''}${data.pages ? `\n  pages   = {${data.pages}},` : ''}
  year    = {${data.year}},
  issn    = {${data.issn}},
  publisher = {${data.publisher}},${data.doi ? `\n  doi     = {${data.doi}},` : ''}
  url     = {${data.url}},${data.keywords?.length ? `\n  keywords = {${data.keywords.join(', ')}},` : ''}${data.abstract ? `\n  abstract = {${data.abstract.replace(/\n/g, ' ')}}` : ''}
}`
}

function generateRISCitation(data: any): string {
  return `TY  - JOUR
AU  - ${data.authors}
TI  - ${data.title}
JO  - ${data.journal}
PY  - ${data.year}${data.volume ? `\nVL  - ${data.volume}` : ''}${data.issue ? `\nIS  - ${data.issue}` : ''}${data.pages ? `\nSP  - ${data.pages.split('-')[0]}\nEP  - ${data.pages.split('-')[1] || data.pages.split('-')[0]}` : ''}
SN  - ${data.issn}
PB  - ${data.publisher}${data.doi ? `\nDO  - ${data.doi}` : ''}
UR  - ${data.url}${data.abstract ? `\nAB  - ${data.abstract}` : ''}${data.keywords?.length ? data.keywords.map((kw: string) => `\nKW  - ${kw}`).join('') : ''}
ER  -`
}

function generateEndNoteCitation(data: any): string {
  return `%0 Journal Article
%A ${data.authors}
%T ${data.title}
%J ${data.journal}
%D ${data.year}${data.volume ? `\n%V ${data.volume}` : ''}${data.issue ? `\n%N ${data.issue}` : ''}${data.pages ? `\n%P ${data.pages}` : ''}
%@ ${data.issn}
%I ${data.publisher}${data.doi ? `\n%R ${data.doi}` : ''}
%U ${data.url}${data.abstract ? `\n%X ${data.abstract}` : ''}${data.keywords?.length ? data.keywords.map((kw: string) => `\n%K ${kw}`).join('') : ''}`
}

function escapeXML(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

