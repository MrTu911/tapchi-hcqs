
/**
 * ✅ Phase 2: User Analytics Service
 * Thống kê và phân tích người dùng
 */

import { prisma } from './prisma'

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  usersByRole: Array<{ role: string; count: number }>
  recentUsers: Array<{
    id: string
    fullName: string
    email: string
    role: string
    createdAt: Date
  }>
  loginActivity: Array<{
    date: string
    logins: number
  }>
  userGrowth: Array<{
    month: string
    count: number
  }>
}

/**
 * Get comprehensive user analytics
 */
export async function getUserAnalytics(): Promise<UserAnalytics> {
  // Total users
  const totalUsers = await prisma.user.count()
  
  // Active/Inactive users
  const activeUsers = await prisma.user.count({
    where: { isActive: true }
  })
  
  const inactiveUsers = totalUsers - activeUsers
  
  // Users by role
  const usersByRoleRaw = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  })
  
  const usersByRole = usersByRoleRaw.map(r => ({
    role: r.role,
    count: r._count.id
  }))
  
  // Recent users (last 10)
  const recentUsers = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  // Login activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const loginLogs = await prisma.auditLog.findMany({
    where: {
      action: 'LOGIN_SUCCESS',
      createdAt: { gte: sevenDaysAgo }
    },
    select: { createdAt: true }
  })
  
  // Group by date
  const loginsByDate = new Map<string, number>()
  loginLogs.forEach(log => {
    const date = log.createdAt.toISOString().split('T')[0]
    loginsByDate.set(date, (loginsByDate.get(date) || 0) + 1)
  })
  
  const loginActivity = Array.from(loginsByDate.entries()).map(([date, logins]) => ({
    date,
    logins
  })).sort((a, b) => a.date.localeCompare(b.date))
  
  // User growth (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo }
    },
    select: { createdAt: true }
  })
  
  const userGrowthMap = new Map<string, number>()
  users.forEach(user => {
    const month = user.createdAt.toISOString().substring(0, 7) // YYYY-MM
    userGrowthMap.set(month, (userGrowthMap.get(month) || 0) + 1)
  })
  
  const userGrowth = Array.from(userGrowthMap.entries()).map(([month, count]) => ({
    month,
    count
  })).sort((a, b) => a.month.localeCompare(b.month))
  
  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersByRole,
    recentUsers,
    loginActivity,
    userGrowth
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string) {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      submissions: { select: { id: true, status: true, createdAt: true } },
      reviews: { select: { id: true, submittedAt: true } },
      editorDecisions: { select: { id: true, decidedAt: true } }
    }
  })
  
  if (!user) {
    return null
  }
  
  // Get audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: { actorId: userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  // Get sessions
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: { gte: new Date() }
    }
  })
  
  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    },
    stats: {
      totalSubmissions: user.submissions.length,
      totalReviews: user.reviews.length,
      totalDecisions: user.editorDecisions.length,
      activeSessions: sessions.length
    },
    recentActivity: auditLogs.map(log => ({
      action: log.action,
      object: log.object,
      createdAt: log.createdAt,
      ipAddress: log.ipAddress
    }))
  }
}
