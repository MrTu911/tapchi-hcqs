/**
 * Permission and Access Control System
 * Centralized logic for role-based access control (RBAC)
 */

import { Role as UserRole } from '@prisma/client';

export enum Resource {
  // Submissions
  SUBMISSION = 'SUBMISSION',
  SUBMISSION_OWN = 'SUBMISSION_OWN',
  
  // Reviews
  REVIEW = 'REVIEW',
  REVIEW_ASSIGNED = 'REVIEW_ASSIGNED',
  
  // Articles
  ARTICLE = 'ARTICLE',
  
  // Issues
  ISSUE = 'ISSUE',
  
  // Users
  USER = 'USER',
  
  // Categories
  CATEGORY = 'CATEGORY',
  
  // Keywords
  KEYWORD = 'KEYWORD',
  
  // Volumes
  VOLUME = 'VOLUME',
  
  // Audit Logs
  AUDIT_LOG = 'AUDIT_LOG',
  
  // System Settings
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
  
  // CMS
  CMS_BANNER = 'CMS_BANNER',
  CMS_MENU = 'CMS_MENU',
  CMS_PAGE = 'CMS_PAGE',
  
  // News
  NEWS = 'NEWS',
  
  // Messages
  MESSAGE = 'MESSAGE',
  
  // Comments
  COMMENT = 'COMMENT',
  
  // Copyediting
  COPYEDIT = 'COPYEDIT',
  
  // Production
  PRODUCTION = 'PRODUCTION',
  
  // Plagiarism
  PLAGIARISM = 'PLAGIARISM',
}

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PUBLISH = 'PUBLISH',
  ASSIGN = 'ASSIGN',
  REVIEW = 'REVIEW',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

/**
 * Permission matrix defining what each role can do
 */
const permissionMatrix: Partial<Record<UserRole, Partial<Record<Resource, Action[]>>>> = {
  [UserRole.AUTHOR]: {
    [Resource.SUBMISSION_OWN]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.MESSAGE]: [Action.CREATE, Action.READ],
    [Resource.COMMENT]: [Action.CREATE, Action.READ],
  },
  
  [UserRole.REVIEWER]: {
    [Resource.REVIEW_ASSIGNED]: [Action.READ, Action.UPDATE, Action.REVIEW],
    [Resource.MESSAGE]: [Action.CREATE, Action.READ],
  },
  
  [UserRole.SECTION_EDITOR]: {
    [Resource.SUBMISSION]: [Action.READ, Action.UPDATE, Action.ASSIGN],
    [Resource.REVIEW]: [Action.READ, Action.ASSIGN],
    [Resource.ARTICLE]: [Action.READ],
    [Resource.MESSAGE]: [Action.CREATE, Action.READ],
    [Resource.COMMENT]: [Action.READ, Action.APPROVE, Action.REJECT],
    [Resource.COPYEDIT]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.PRODUCTION]: [Action.READ],
    [Resource.PLAGIARISM]: [Action.CREATE, Action.READ],
  },
  
  [UserRole.MANAGING_EDITOR]: {
    [Resource.SUBMISSION]: [Action.READ, Action.UPDATE, Action.ASSIGN, Action.APPROVE, Action.REJECT],
    [Resource.REVIEW]: [Action.READ, Action.ASSIGN],
    [Resource.ARTICLE]: [Action.READ, Action.UPDATE],
    [Resource.ISSUE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CATEGORY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.KEYWORD]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.VOLUME]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.MESSAGE]: [Action.CREATE, Action.READ],
    [Resource.COMMENT]: [Action.READ, Action.APPROVE, Action.REJECT, Action.DELETE],
    [Resource.NEWS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.CMS_BANNER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CMS_MENU]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CMS_PAGE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.COPYEDIT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.PRODUCTION]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.PLAGIARISM]: [Action.CREATE, Action.READ, Action.UPDATE],
  },
  
  [UserRole.EIC]: {
    [Resource.SUBMISSION]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE, Action.REJECT, Action.PUBLISH],
    [Resource.REVIEW]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.ASSIGN],
    [Resource.ARTICLE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.ISSUE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.USER]: [Action.READ],
    [Resource.CATEGORY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.KEYWORD]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.VOLUME]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.MESSAGE]: [Action.CREATE, Action.READ],
    [Resource.COMMENT]: [Action.READ, Action.APPROVE, Action.REJECT, Action.DELETE],
    [Resource.NEWS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.CMS_BANNER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CMS_MENU]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CMS_PAGE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.COPYEDIT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.PRODUCTION]: [Action.CREATE, Action.READ, Action.UPDATE, Action.PUBLISH],
    [Resource.PLAGIARISM]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.SYSTEM_SETTINGS]: [Action.READ, Action.UPDATE],
  },
  
  [UserRole.SYSADMIN]: {
    // Sysadmin has all permissions
    [Resource.SUBMISSION]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE, Action.REJECT, Action.PUBLISH],
    [Resource.REVIEW]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.ASSIGN],
    [Resource.ARTICLE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.ISSUE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.USER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CATEGORY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.KEYWORD]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.VOLUME]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.AUDIT_LOG]: [Action.READ],
    [Resource.MESSAGE]: [Action.CREATE, Action.READ, Action.DELETE],
    [Resource.COMMENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE, Action.REJECT],
    [Resource.NEWS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.CMS_BANNER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CMS_MENU]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CMS_PAGE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.COPYEDIT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.PRODUCTION]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH],
    [Resource.PLAGIARISM]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.SYSTEM_SETTINGS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  },
};

/**
 * Check if a user role can perform an action on a resource
 */
export function canAccess(
  userRole: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const permissions = permissionMatrix[userRole];
  if (!permissions) {
    return false;
  }
  
  const allowedActions = permissions[resource];
  if (!allowedActions) {
    return false;
  }
  
  return allowedActions.includes(action);
}

/**
 * Check if user is admin (EIC or SYSADMIN)
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.EIC || userRole === UserRole.SYSADMIN;
}

/**
 * Check if user is editor or higher
 */
export function isEditor(userRole: UserRole): boolean {
  return (
    userRole === UserRole.SECTION_EDITOR ||
    userRole === UserRole.MANAGING_EDITOR ||
    userRole === UserRole.EIC ||
    userRole === UserRole.SYSADMIN
  );
}

/**
 * Check if user can manage content (ME, EIC, SYSADMIN)
 */
export function canManageContent(userRole: UserRole): boolean {
  return (
    userRole === UserRole.MANAGING_EDITOR ||
    userRole === UserRole.EIC ||
    userRole === UserRole.SYSADMIN
  );
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): Partial<Record<Resource, Action[]>> {
  return permissionMatrix[userRole] || {};
}
