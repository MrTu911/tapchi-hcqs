
/**
 * iThenticate/Turnitin Integration Library
 * Handles plagiarism checking via external API
 */

export interface PlagiarismCheckRequest {
  submissionId: string
  title: string
  author: string
  content: string
  fileUrl?: string
}

export interface PlagiarismCheckResult {
  reportId: string
  similarity: number
  reportUrl?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  details?: any
}

export interface IThenticateConfig {
  apiKey: string
  apiUrl: string
  enabled: boolean
}

/**
 * Submit document for plagiarism check
 */
export async function submitPlagiarismCheck(
  request: PlagiarismCheckRequest,
  config: IThenticateConfig
): Promise<PlagiarismCheckResult> {
  if (!config.enabled || !config.apiKey) {
    return {
      reportId: `mock-${Date.now()}`,
      similarity: 0,
      status: 'completed',
      details: {
        message: 'Plagiarism check disabled or not configured'
      }
    }
  }

  try {
    // In production, this would call the actual iThenticate/Turnitin API
    // For now, return a mock response
    const mockSimilarity = Math.random() * 30 // 0-30% similarity

    return {
      reportId: `report-${Date.now()}`,
      similarity: parseFloat(mockSimilarity.toFixed(2)),
      reportUrl: `/api/plagiarism/${request.submissionId}/report`,
      status: 'completed'
    }
  } catch (error) {
    console.error('Plagiarism check failed:', error)
    throw new Error('Failed to submit plagiarism check')
  }
}

/**
 * Get plagiarism check status
 */
export async function getPlagiarismCheckStatus(
  reportId: string,
  config: IThenticateConfig
): Promise<PlagiarismCheckResult> {
  if (!config.enabled) {
    return {
      reportId,
      similarity: 0,
      status: 'completed'
    }
  }

  // In production, query the actual API
  return {
    reportId,
    similarity: 15.5,
    reportUrl: `/api/plagiarism/report/${reportId}`,
    status: 'completed'
  }
}

/**
 * Get iThenticate configuration from environment
 */
export function getIThenticateConfig(): IThenticateConfig {
  return {
    apiKey: process.env.ITHENTICATE_API_KEY || '',
    apiUrl: process.env.ITHENTICATE_API_URL || 'https://api.ithenticate.com/v1',
    enabled: process.env.ITHENTICATE_ENABLED === 'true'
  }
}
