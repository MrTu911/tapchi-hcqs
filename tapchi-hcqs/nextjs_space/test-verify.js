const jwt = require('jsonwebtoken')

const secret = 'your-very-long-jwt-secret-key-for-military-logistics-journal-2024'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI3ZmY3YWUyYy02NjhmLTQ1MWQtOGE1Yy1mODhiYjZlMWNhOTMiLCJyb2xlIjoiU1lTQURNSU4iLCJlbWFpbCI6ImpvaG5AZG9lLmNvbSIsImZ1bGxOYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE3NjE4MzUxMTIsImV4cCI6MTc2MTg2MzkxMn0.u-rfZEJO-RERf1Kq2lrqSV6hGRkJw5GMiNluX-v6WaQ'

try {
  const decoded = jwt.verify(token, secret)
  console.log('✓ Token hợp lệ:', JSON.stringify(decoded, null, 2))
} catch (error) {
  console.error('✗ Token không hợp lệ:', error.message)
}
