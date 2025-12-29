
/**
 * ✅ Giai đoạn 2: End-to-End Testing
 * Test toàn bộ workflow: Submit → Review → Decision → Publish
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test accounts (từ seed data)
const ACCOUNTS = {
  admin: {
    email: 'admin@tapchi.mil.vn',
    password: 'Admin123!@#',
    role: 'SYSADMIN'
  },
  editor: {
    email: 'editor@tapchi.mil.vn',
    password: 'Editor123!@#',
    role: 'SECTION_EDITOR'
  },
  author: {
    email: 'author@tapchi.mil.vn',
    password: 'Author123!@#',
    role: 'AUTHOR'
  },
  reviewer: {
    email: 'reviewer@tapchi.mil.vn',
    password: 'Reviewer123!@#',
    role: 'REVIEWER'
  }
}

test.describe('Submission Workflow E2E', () => {
  let submissionId: string
  let submissionCode: string
  
  test('1. Author submits a new article', async ({ page }) => {
    // Login as author
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.author.email)
    await page.fill('input[name="password"]', ACCOUNTS.author.password)
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to submission form
    await page.goto(`${BASE_URL}/dashboard/author/submit`)
    
    // Fill submission form
    await page.fill('input[name="title"]', 'Test Article - E2E Testing')
    await page.fill('textarea[name="abstractVn"]', 'Đây là tóm tắt tiếng Việt cho bài test E2E')
    await page.fill('textarea[name="abstractEn"]', 'This is English abstract for E2E test article')
    await page.fill('input[name="keywords"]', 'test, e2e, automation')
    
    // Select category
    await page.selectOption('select[name="categoryId"]', { index: 1 })
    
    // Submit
    await page.click('button[type="submit"]')
    
    // Wait for success
    await page.waitForSelector('text=successfully', { timeout: 10000 })
    
    // Get submission code from URL or response
    const url = page.url()
    submissionId = url.split('/').pop() || ''
    
    expect(submissionId).toBeTruthy()
  })
  
  test('2. Editor assigns reviewers', async ({ page }) => {
    // Login as editor
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.editor.email)
    await page.fill('input[name="password"]', ACCOUNTS.editor.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to submissions list
    await page.goto(`${BASE_URL}/dashboard/editor/submissions`)
    
    // Find the test submission
    await page.click(`text=Test Article - E2E Testing`)
    
    // Assign reviewer
    await page.click('button:has-text("Assign Reviewers")')
    await page.selectOption('select[name="reviewerId"]', { index: 1 })
    await page.click('button:has-text("Assign")')
    
    // Wait for success
    await page.waitForSelector('text=assigned', { timeout: 10000 })
  })
  
  test('3. Reviewer submits review', async ({ page }) => {
    // Login as reviewer
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.reviewer.email)
    await page.fill('input[name="password"]', ACCOUNTS.reviewer.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to reviews
    await page.goto(`${BASE_URL}/dashboard/reviewer`)
    
    // Find the assigned review
    await page.click(`text=Test Article - E2E Testing`)
    
    // Fill review form
    await page.fill('input[name="score"]', '85')
    await page.selectOption('select[name="recommendation"]', 'ACCEPT')
    await page.fill('textarea[name="comments"]', 'This article is well-written and meets all requirements.')
    
    // Submit review
    await page.click('button:has-text("Submit Review")')
    
    // Wait for success
    await page.waitForSelector('text=submitted', { timeout: 10000 })
  })
  
  test('4. Editor makes decision', async ({ page }) => {
    // Login as editor
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.editor.email)
    await page.fill('input[name="password"]', ACCOUNTS.editor.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to submission
    await page.goto(`${BASE_URL}/dashboard/editor/submissions`)
    await page.click(`text=Test Article - E2E Testing`)
    
    // Make decision
    await page.click('button:has-text("Make Decision")')
    await page.selectOption('select[name="decision"]', 'ACCEPT')
    await page.fill('textarea[name="note"]', 'Article accepted based on positive review.')
    
    // Submit decision
    await page.click('button:has-text("Submit Decision")')
    
    // Wait for success
    await page.waitForSelector('text=decision', { timeout: 10000 })
  })
  
  test('5. Admin publishes article to issue', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.admin.email)
    await page.fill('input[name="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to issues
    await page.goto(`${BASE_URL}/dashboard/admin/issues`)
    
    // Find or create an issue
    const issueExists = await page.locator('text=Draft Issue').count() > 0
    
    if (!issueExists) {
      await page.click('button:has-text("Create Issue")')
      await page.fill('input[name="number"]', '1')
      await page.fill('input[name="year"]', new Date().getFullYear().toString())
      await page.click('button:has-text("Create")')
    }
    
    // Add article to issue
    await page.click('text=Draft Issue')
    await page.click('button:has-text("Add Article")')
    await page.fill('input[name="search"]', 'Test Article - E2E Testing')
    await page.click('button:has-text("Add to Issue")')
    
    // Publish issue
    await page.click('button:has-text("Publish Issue")')
    await page.click('button:has-text("Confirm")')
    
    // Wait for success
    await page.waitForSelector('text=published', { timeout: 10000 })
  })
  
  test('6. Verify article is publicly accessible', async ({ page }) => {
    // Navigate to public articles page
    await page.goto(`${BASE_URL}/articles`)
    
    // Search for the test article
    await page.fill('input[name="search"]', 'Test Article - E2E Testing')
    await page.click('button:has-text("Search")')
    
    // Verify article appears in results
    await expect(page.locator('text=Test Article - E2E Testing')).toBeVisible()
    
    // Click on article
    await page.click('text=Test Article - E2E Testing')
    
    // Verify article page loads
    await expect(page.locator('h1:has-text("Test Article - E2E Testing")')).toBeVisible()
    
    // Verify PDF download button exists
    await expect(page.locator('button:has-text("Download PDF")')).toBeVisible()
  })
})

test.describe('Security Tests', () => {
  test('7. Verify two-person rule for SENSITIVE submissions', async ({ page, context }) => {
    // Login as author
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.author.email)
    await page.fill('input[name="password"]', ACCOUNTS.author.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/dashboard/)
    
    // Submit SENSITIVE article
    await page.goto(`${BASE_URL}/dashboard/author/submit`)
    await page.fill('input[name="title"]', 'Sensitive Article - Two Person Rule Test')
    await page.fill('textarea[name="abstractVn"]', 'Tóm tắt bài viết mật')
    await page.selectOption('select[name="securityLevel"]', 'SENSITIVE')
    await page.selectOption('select[name="categoryId"]', { index: 1 })
    await page.click('button[type="submit"]')
    
    await page.waitForSelector('text=successfully')
    
    // Now login as editor (first approver)
    const editorPage = await context.newPage()
    await editorPage.goto(`${BASE_URL}/auth/login`)
    await editorPage.fill('input[name="email"]', ACCOUNTS.editor.email)
    await editorPage.fill('input[name="password"]', ACCOUNTS.editor.password)
    await editorPage.click('button[type="submit"]')
    
    await editorPage.waitForURL(/\/dashboard/)
    
    // Try to make decision alone
    await editorPage.goto(`${BASE_URL}/dashboard/editor/submissions`)
    await editorPage.click('text=Sensitive Article')
    await editorPage.click('button:has-text("Make Decision")')
    
    // Should see warning about two-person rule
    await expect(editorPage.locator('text=two.*person.*rule')).toBeVisible({ timeout: 5000 })
    
    // Second approver needed (EIC or Admin)
    const adminPage = await context.newPage()
    await adminPage.goto(`${BASE_URL}/auth/login`)
    await adminPage.fill('input[name="email"]', ACCOUNTS.admin.email)
    await adminPage.fill('input[name="password"]', ACCOUNTS.admin.password)
    await adminPage.click('button[type="submit"]')
    
    // Admin approves
    await adminPage.goto(`${BASE_URL}/dashboard/admin/submissions`)
    await adminPage.click('text=Sensitive Article')
    await adminPage.click('button:has-text("Approve Decision")')
    
    // Now decision should be allowed
    await expect(adminPage.locator('text=approved')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('File Upload/Download Tests', () => {
  test('8. Test file upload with S3 and Local fallback', async ({ page }) => {
    // Login as author
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.author.email)
    await page.fill('input[name="password"]', ACCOUNTS.author.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to file upload
    await page.goto(`${BASE_URL}/dashboard/author/submit`)
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-manuscript.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test PDF content')
    })
    
    // Wait for upload to complete
    await page.waitForSelector('text=uploaded', { timeout: 10000 })
    
    // Verify file appears in list
    await expect(page.locator('text=test-manuscript.pdf')).toBeVisible()
  })
  
  test('9. Test file download', async ({ page }) => {
    // Login and navigate to a submission with files
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[name="email"]', ACCOUNTS.author.email)
    await page.fill('input[name="password"]', ACCOUNTS.author.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/\/dashboard/)
    
    // Navigate to submission
    await page.goto(`${BASE_URL}/dashboard/author`)
    await page.click('text=Test Article')
    
    // Click download button
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Download")')
    const download = await downloadPromise
    
    // Verify download started
    expect(download.suggestedFilename()).toBeTruthy()
  })
})

test.describe('Search FTS Tests', () => {
  test('10. Test Full-Text Search', async ({ page }) => {
    // Navigate to search page
    await page.goto(`${BASE_URL}/search`)
    
    // Search with FTS
    await page.fill('input[name="q"]', 'test article')
    await page.click('button:has-text("Search")')
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    // Verify results appear
    const results = await page.locator('[data-testid="article-card"]').count()
    expect(results).toBeGreaterThan(0)
    
    // Verify relevance ranking (first result should be most relevant)
    const firstResult = await page.locator('[data-testid="article-card"]').first()
    await expect(firstResult).toContainText(/test/i)
  })
  
  test('11. Test search filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    
    // Apply category filter
    await page.selectOption('select[name="category"]', { index: 1 })
    await page.fill('input[name="q"]', 'test')
    await page.click('button:has-text("Search")')
    
    // Verify filtered results
    await page.waitForSelector('[data-testid="search-results"]')
    const results = await page.locator('[data-testid="article-card"]').count()
    
    // All results should belong to selected category
    const categoryBadges = await page.locator('[data-testid="category-badge"]').allTextContents()
    const allSameCategory = categoryBadges.every(badge => badge === categoryBadges[0])
    expect(allSameCategory).toBeTruthy()
  })
})

test.describe('PDF Generation Tests', () => {
  test('12. Test PDF generation for article', async ({ page }) => {
    // Navigate to published article
    await page.goto(`${BASE_URL}/articles`)
    await page.click('text=Test Article - E2E Testing')
    
    // Click PDF download/generate button
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Download PDF")')
    
    // Wait for PDF generation
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.pdf')
    
    // Verify PDF file size is reasonable
    const path = await download.path()
    const fs = require('fs')
    const stats = fs.statSync(path)
    expect(stats.size).toBeGreaterThan(1000) // At least 1KB
  })
})

test.describe('Rate Limiting Tests', () => {
  test('13. Test rate limiting on sensitive endpoints', async ({ page }) => {
    // Make multiple rapid requests to login endpoint
    const requests: Promise<any>[] = []
    
    for (let i = 0; i < 125; i++) { // Exceed the 120 req/min limit
      requests.push(
        fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrong'
          })
        })
      )
    }
    
    const responses = await Promise.all(requests)
    
    // Some requests should be rate limited (429)
    const rateLimited = responses.filter(r => r.status === 429)
    expect(rateLimited.length).toBeGreaterThan(0)
    
    // Verify rate limit headers
    const limitedResponse = rateLimited[0]
    expect(limitedResponse.headers.get('X-RateLimit-Remaining')).toBeDefined()
    expect(limitedResponse.headers.get('X-RateLimit-Reset')).toBeDefined()
  })
})
