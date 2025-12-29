

export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/responses'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { saveFile } from '@/lib/storage'

/**
 * ✅ Giai đoạn 2: PDF Rendering cho Articles
 * GET /api/articles/[id]/pdf - Generate và return PDF
 * POST /api/articles/[id]/pdf - Force regenerate PDF
 */

async function getBrowser() {
  // Trong production trên AWS Lambda, dùng chromium từ @sparticuz/chromium
  // Trong development, dùng local Chrome
  const isDev = process.env.NODE_ENV !== 'production'
  
  if (isDev) {
    // Development: Sử dụng local Chrome
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })
    return browser
  } else {
    // Production: Sử dụng chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    })
    return browser
  }
}

function generateArticleHTML(article: any): string {
  const { submission, issue } = article
  const author = submission.author
  const category = submission.category
  
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${submission.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          padding: 2cm;
          background: #fff;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2cm;
          padding-bottom: 1cm;
          border-bottom: 2px solid #333;
        }
        
        .journal-name {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 0.5cm;
        }
        
        .issue-info {
          font-size: 10pt;
          color: #666;
          margin-bottom: 0.3cm;
        }
        
        .title {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          margin: 1cm 0;
          color: #1a1a1a;
        }
        
        .authors {
          text-align: center;
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 1cm;
          color: #333;
        }
        
        .meta-info {
          margin: 1cm 0;
          padding: 0.5cm;
          background: #f5f5f5;
          border-left: 4px solid #2563eb;
        }
        
        .meta-label {
          font-weight: bold;
          display: inline-block;
          min-width: 120px;
        }
        
        .abstract {
          margin: 1cm 0;
        }
        
        .abstract-title {
          font-weight: bold;
          font-size: 13pt;
          margin-bottom: 0.3cm;
        }
        
        .abstract-content {
          text-align: justify;
          margin-bottom: 0.5cm;
        }
        
        .keywords {
          font-style: italic;
          margin-top: 0.5cm;
        }
        
        .content {
          text-align: justify;
          margin: 1cm 0;
        }
        
        .footer {
          margin-top: 2cm;
          padding-top: 1cm;
          border-top: 1px solid #ccc;
          font-size: 10pt;
          color: #666;
          text-align: center;
        }
        
        .page-number {
          position: fixed;
          bottom: 1cm;
          right: 1cm;
          font-size: 10pt;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="journal-name">
          Tạp chí Khoa học Hậu cần Quân sự
        </div>
        ${issue ? `
          <div class="issue-info">
            Tập ${issue.volume?.volumeNo || 'N/A'}, Số ${issue.number}, Năm ${issue.year}
          </div>
        ` : ''}
      </div>
      
      <div class="title">
        ${submission.title}
      </div>
      
      <div class="authors">
        ${author.fullName}${author.org ? ` - ${author.org}` : ''}
      </div>
      
      <div class="meta-info">
        ${category ? `
          <div>
            <span class="meta-label">Chuyên mục:</span>
            ${category.name}
          </div>
        ` : ''}
        <div>
          <span class="meta-label">Mã bài:</span>
          ${submission.code}
        </div>
        ${article.pages ? `
          <div>
            <span class="meta-label">Trang:</span>
            ${article.pages}
          </div>
        ` : ''}
        ${article.publishedAt ? `
          <div>
            <span class="meta-label">Ngày xuất bản:</span>
            ${new Date(article.publishedAt).toLocaleDateString('vi-VN')}
          </div>
        ` : ''}
        ${article.doiLocal ? `
          <div>
            <span class="meta-label">DOI:</span>
            ${article.doiLocal}
          </div>
        ` : ''}
      </div>
      
      ${submission.abstractVn ? `
        <div class="abstract">
          <div class="abstract-title">Tóm tắt</div>
          <div class="abstract-content">
            ${submission.abstractVn}
          </div>
        </div>
      ` : ''}
      
      ${submission.abstractEn ? `
        <div class="abstract">
          <div class="abstract-title">Abstract</div>
          <div class="abstract-content">
            ${submission.abstractEn}
          </div>
        </div>
      ` : ''}
      
      ${submission.keywords && submission.keywords.length > 0 ? `
        <div class="keywords">
          <strong>Từ khóa:</strong> ${submission.keywords.join(', ')}
        </div>
      ` : ''}
      
      ${article.htmlBody ? `
        <div class="content page-break">
          ${article.htmlBody}
        </div>
      ` : ''}
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Tạp chí Khoa học Hậu cần Quân sự</p>
        ${author.email ? `<p>Liên hệ: ${author.email}</p>` : ''}
      </div>
    </body>
    </html>
  `
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Lấy article
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            category: true,
            author: {
              select: {
                id: true,
                fullName: true,
                org: true,
                email: true
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
      return errorResponse('Article not found', 404)
    }
    
    // Nếu đã có PDF, return URL
    if (article.pdfFile) {
      return new Response(JSON.stringify({ 
        success: true,
        pdfUrl: `/api/files/download?key=${encodeURIComponent(article.pdfFile)}`,
        cached: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Generate PDF
    const browser = await getBrowser()
    const page = await browser.newPage()
    
    const html = generateArticleHTML(article)
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    })
    
    await browser.close()
    
    // Save PDF
    const fileName = `${article.submission.code}.pdf`
    const result = await saveFile(Buffer.from(pdfBuffer), fileName, 'application/pdf')
    
    // Update article với PDF path
    await prisma.article.update({
      where: { id },
      data: {
        pdfFile: result.key
      }
    })
    
    return new Response(JSON.stringify({
      success: true,
      pdfUrl: result.url,
      cached: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return errorResponse('Failed to generate PDF: ' + error.message)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Xóa PDF cũ nếu có
    const article = await prisma.article.findUnique({
      where: { id },
      select: { pdfFile: true }
    })
    
    if (article?.pdfFile) {
      await prisma.article.update({
        where: { id },
        data: { pdfFile: null }
      })
    }
    
    // Regenerate bằng cách gọi GET
    return GET(request, { params })
  } catch (error) {
    console.error('PDF regeneration error:', error)
    return errorResponse('Failed to regenerate PDF')
  }
}
