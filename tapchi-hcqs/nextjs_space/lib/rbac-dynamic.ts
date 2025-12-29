
import { prisma } from './prisma'
import { Role } from '@prisma/client'

/**
 * Dynamic RBAC system using database permissions
 * This complements the hardcoded RBAC in lib/rbac.ts
 */

// Cache for permissions to avoid repeated database queries
let permissionsCache: Map<string, Set<string>> = new Map()
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Load permissions from database and cache them
 */
export async function loadPermissionsCache(): Promise<void> {
  try {
    const now = Date.now()
    
    // Return cached data if still valid
    if (permissionsCache.size > 0 && now - cacheTimestamp < CACHE_TTL) {
      return
    }

    // Load all role permissions from database
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { 
        isGranted: true,
        permission: {
          isActive: true
        }
      },
      include: {
        permission: true
      }
    })

    // Build cache
    const newCache = new Map<string, Set<string>>()
    
    for (const rp of rolePermissions) {
      if (!rp.permission) continue
      
      const key = rp.role
      if (!newCache.has(key)) {
        newCache.set(key, new Set())
      }
      newCache.get(key)!.add(rp.permission.code)
    }

    permissionsCache = newCache
    cacheTimestamp = now
  } catch (error) {
    console.error('Failed to load permissions cache:', error)
  }
}

/**
 * Check if a role has a specific permission
 */
export async function hasPermission(role: Role, permissionCode: string): Promise<boolean> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return false
  
  return rolePerms.has(permissionCode)
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(role: Role): Promise<string[]> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return []
  
  return Array.from(rolePerms)
}

/**
 * Check if a role has any of the specified permissions
 */
export async function hasAnyPermission(role: Role, permissionCodes: string[]): Promise<boolean> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return false
  
  return permissionCodes.some(code => rolePerms.has(code))
}

/**
 * Check if a role has all of the specified permissions
 */
export async function hasAllPermissions(role: Role, permissionCodes: string[]): Promise<boolean> {
  await loadPermissionsCache()
  
  const rolePerms = permissionsCache.get(role)
  if (!rolePerms) return false
  
  return permissionCodes.every(code => rolePerms.has(code))
}

/**
 * Clear the permissions cache (useful after updating permissions)
 */
export function clearPermissionsCache(): void {
  permissionsCache.clear()
  cacheTimestamp = 0
}

/**
 * Permission checker middleware for API routes
 */
export async function checkApiPermission(
  userRole: Role | undefined,
  requiredPermission: string
): Promise<{ allowed: boolean; message?: string }> {
  if (!userRole) {
    return { allowed: false, message: 'Chưa đăng nhập' }
  }

  // SYSADMIN always has access
  if (userRole === 'SYSADMIN') {
    return { allowed: true }
  }

  const allowed = await hasPermission(userRole, requiredPermission)
  
  if (!allowed) {
    return { allowed: false, message: 'Không có quyền truy cập' }
  }

  return { allowed: true }
}
