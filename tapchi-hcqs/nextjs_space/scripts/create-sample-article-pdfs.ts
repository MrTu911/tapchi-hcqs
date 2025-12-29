import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

config()
const prisma = new PrismaClient()

async function main() {
  console.log('📄 Tạo placeholder PDF files cho articles...\n')

  // Đảm bảo thư mục public/articles tồn tại
  const articlesDir = path.join(process.cwd(), 'public', 'articles')
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true })
  }

  // Lấy tất cả articles
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      pdfFile: true
    }
  })

  console.log(`✅ Tìm thấy ${articles.length} articles`)

  // Tạo file PDF placeholder đơn giản (chỉ là file text)
  let created = 0
  for (const article of articles) {
    if (article.pdfFile) {
      // Remove leading / nếu có
      const pdfPath = article.pdfFile.startsWith('/') 
        ? article.pdfFile.substring(1) 
        : article.pdfFile
      
      const fullPath = path.join(process.cwd(), 'public', pdfPath)
      
      // Tạo thư mục nếu chưa tồn tại
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      // Tạo file PDF placeholder nếu chưa tồn tại
      if (!fs.existsSync(fullPath)) {
        const content = `%PDF-1.4
%placeholder PDF for article ${article.id}
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 700 Td
(Sample Article PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000131 00000 n 
0000000291 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
385
%%EOF`
        
        fs.writeFileSync(fullPath, content)
        console.log(`   ✅ Tạo PDF: ${pdfPath}`)
        created++
      }
    }
  }

  console.log(`\n✅ Đã tạo ${created} PDF files`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
