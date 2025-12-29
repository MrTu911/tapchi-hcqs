
const pdf = require('pdf-parse')

export interface PdfMetadata {
  title?: string
  authors?: string
  textLength: number
  pageCount: number
  error?: string
}

/**
 * Trích xuất metadata từ PDF file
 * @param buffer Buffer của file PDF
 * @returns Metadata của PDF bao gồm tiêu đề, tác giả, số trang, độ dài text
 */
export async function extractPdfMetadata(buffer: Buffer): Promise<PdfMetadata> {
  try {
    const data = await pdf(buffer)
    
    // Lấy text từ PDF
    const lines = data.text
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean)

    // Thử trích xuất tiêu đề từ dòng đầu tiên (thường là tiêu đề)
    const title = lines[0] || 'Không rõ tiêu đề'
    
    // Thử trích xuất tác giả (thường ở dòng thứ 2 hoặc 3)
    // Tác giả thường có dấu phẩy phân cách
    let authors = 'Không rõ tác giả'
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const line = lines[i]
      // Kiểm tra xem có phải tên tác giả không (có dấu phẩy hoặc chữ "and")
      if (line.includes(',') || line.toLowerCase().includes(' and ') || 
          line.toLowerCase().includes(' và ')) {
        authors = line
        break
      }
    }

    // Trích xuất metadata từ PDF info
    const info = data.info || {}
    
    return {
      title: info.Title || title,
      authors: info.Author || authors,
      textLength: data.text.length,
      pageCount: data.numpages
    }
  } catch (error) {
    console.error('Lỗi khi trích xuất metadata từ PDF:', error)
    return {
      title: 'Lỗi trích xuất',
      authors: 'N/A',
      textLength: 0,
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate PDF file
 * @param buffer Buffer của file PDF
 * @returns true nếu là PDF hợp lệ
 */
export async function validatePdf(buffer: Buffer): Promise<boolean> {
  try {
    await pdf(buffer)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Trích xuất text từ PDF
 * @param buffer Buffer của file PDF
 * @returns Text content của PDF
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('Lỗi khi trích xuất text từ PDF:', error)
    return ''
  }
}

/**
 * Trích xuất keywords từ PDF text (dựa vào tần suất xuất hiện)
 * @param text Text content của PDF
 * @param limit Số lượng keywords tối đa
 * @returns Mảng keywords
 */
export function extractKeywordsFromText(text: string, limit: number = 10): string[] {
  try {
    // Loại bỏ ký tự đặc biệt và chuyển về chữ thường
    const words = text
      .toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3) // Chỉ lấy từ có độ dài > 3 ký tự

    // Đếm tần suất xuất hiện
    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Sắp xếp theo tần suất và lấy top keywords
    const sortedWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word)

    return sortedWords
  } catch (error) {
    console.error('Lỗi khi trích xuất keywords:', error)
    return []
  }
}
