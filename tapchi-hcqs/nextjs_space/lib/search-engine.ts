
/**
 * Semantic Search Engine
 * Implements intelligent search using embeddings and vector similarity
 */

export interface SearchQuery {
  query: string
  filters?: {
    category?: string
    status?: string
    dateFrom?: Date
    dateTo?: Date
  }
  limit?: number
}

export interface SearchResult {
  id: string
  title: string
  abstractVn?: string
  abstractEn?: string
  score: number
  highlights?: string[]
}

/**
 * Generate text embedding using a simple hash-based approach
 * In production, replace with actual embedding API (OpenAI, Cohere, etc.)
 */
function generateSimpleEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().trim()
  const words = normalized.split(/\s+/)
  const embedding = new Array(128).fill(0)

  words.forEach((word, index) => {
    const hash = simpleHash(word)
    embedding[hash % 128] += 1 / (index + 1)
  })

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => val / (magnitude || 1))
}

/**
 * Simple hash function
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Perform semantic search on submissions
 */
export async function semanticSearch(
  query: SearchQuery,
  submissions: Array<{
    id: string
    title: string
    abstractVn?: string
    abstractEn?: string
    keywords: string[]
  }>
): Promise<SearchResult[]> {
  const queryEmbedding = generateSimpleEmbedding(query.query)

  const results = submissions.map(submission => {
    const text = [
      submission.title,
      submission.abstractVn || '',
      submission.abstractEn || '',
      ...submission.keywords
    ].join(' ')

    const submissionEmbedding = generateSimpleEmbedding(text)
    const score = cosineSimilarity(queryEmbedding, submissionEmbedding)

    return {
      id: submission.id,
      title: submission.title,
      abstractVn: submission.abstractVn,
      abstractEn: submission.abstractEn,
      score
    }
  })

  return results
    .filter(result => result.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, query.limit || 10)
}

/**
 * Extract keywords from text using TF-IDF
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)

  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}
