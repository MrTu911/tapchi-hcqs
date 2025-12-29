
export type Role = 
  | "READER" 
  | "AUTHOR" 
  | "REVIEWER" 
  | "SECTION_EDITOR"
  | "MANAGING_EDITOR" 
  | "EIC" 
  | "LAYOUT_EDITOR" 
  | "SYSADMIN" 
  | "SECURITY_AUDITOR"

export const roleHierarchy: Record<Role, number> = {
  READER: 1,
  AUTHOR: 2,
  REVIEWER: 3,
  SECTION_EDITOR: 4,
  LAYOUT_EDITOR: 4,
  MANAGING_EDITOR: 5,
  SECURITY_AUDITOR: 5,
  EIC: 6,
  SYSADMIN: 7
}

export const can = {
  // Quyền đọc và xem nội dung công khai
  read: (role?: Role) => true, // Mọi người đều có thể đọc nội dung công khai

  // Quyền nộp bài
  submit: (role?: Role) => role === "AUTHOR" || 
    (role && roleHierarchy[role] >= roleHierarchy["AUTHOR"]),

  // Quyền gán phản biện
  assignReview: (role?: Role) => role === "SECTION_EDITOR" || 
    role === "MANAGING_EDITOR" || 
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền phản biện
  review: (role?: Role) => role === "REVIEWER" ||
    (role && roleHierarchy[role] >= roleHierarchy["REVIEWER"]),

  // Quyền đưa ra quyết định biên tập
  decide: (role?: Role) => role === "SECTION_EDITOR" || 
    role === "MANAGING_EDITOR" || 
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền dàn trang
  layout: (role?: Role) => role === "LAYOUT_EDITOR" ||
    role === "MANAGING_EDITOR" ||
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền xuất bản
  publish: (role?: Role) => role === "EIC" || role === "SYSADMIN",

  // Quyền quản trị (EIC có đầy đủ quyền admin như SYSADMIN)
  admin: (role?: Role) => role === "SYSADMIN" || role === "EIC" || role === "MANAGING_EDITOR",

  // Quyền kiểm định bảo mật
  securityAudit: (role?: Role) => role === "SECURITY_AUDITOR" ||
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền xem dashboard theo vai trò
  accessDashboard: (role?: Role, targetRole?: string) => {
    if (!role || !targetRole) return false
    
    switch (targetRole) {
      case 'author':
        return can.submit(role)
      case 'reviewer':
        return can.review(role)
      case 'editor':
        return can.decide(role)
      case 'managing':
        return role === "MANAGING_EDITOR" || role === "EIC" || role === "SYSADMIN"
      case 'eic':
        return role === "EIC" || role === "SYSADMIN"
      case 'admin':
        return can.admin(role)
      default:
        return false
    }
  }
}

export function hasRole(userRole?: Role, requiredRoles?: Role[]): boolean {
  if (!userRole || !requiredRoles) return false
  return requiredRoles.includes(userRole)
}

export function hasMinimumRole(userRole?: Role, minimumRole?: Role): boolean {
  if (!userRole || !minimumRole) return false
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole]
}

// Helper để check quyền trong middleware
export function checkPermission(
  userRole?: Role, 
  permission?: keyof typeof can,
  ...args: any[]
): boolean {
  if (!permission || !userRole) return false
  return (can[permission] as any)(userRole, ...args)
}
