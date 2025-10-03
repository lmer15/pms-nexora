import React from 'react';
import { useUserRole } from '../hooks/useUserRole';

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  'owner': 4,
  'manager': 3,
  'member': 2,
  'guest': 1
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// Permission types
export type Permission = 
  | 'facility.manage'
  | 'facility.delete'
  | 'facility.transfer_ownership'
  | 'users.invite'
  | 'users.remove'
  | 'users.change_roles'
  | 'users.view_all'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'projects.archive'
  | 'tasks.create'
  | 'tasks.edit'
  | 'tasks.delete'
  | 'tasks.assign'
  | 'tasks.view_all'
  | 'comments.add'
  | 'attachments.add'
  | 'time_logs.view_all'
  | 'time_logs.approve'
  | 'reports.view'
  | 'reports.export'
  | 'notifications.manage';

// Permission matrix - defines what each role can do
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'facility.manage',
    'facility.delete',
    'facility.transfer_ownership',
    'users.invite',
    'users.remove',
    'users.change_roles',
    'users.view_all',
    'projects.create',
    'projects.edit',
    'projects.delete',
    'projects.archive',
    'tasks.create',
    'tasks.edit',
    'tasks.delete',
    'tasks.assign',
    'tasks.view_all',
    'comments.add',
    'attachments.add',
    'time_logs.view_all',
    'time_logs.approve',
    'reports.view',
    'reports.export',
    'notifications.manage'
  ],
  manager: [
    'facility.manage',
    'users.invite',
    'users.remove',
    'users.change_roles',
    'users.view_all',
    'projects.create',
    'projects.edit',
    'projects.delete',
    'projects.archive',
    'tasks.create',
    'tasks.edit',
    'tasks.delete',
    'tasks.assign',
    'tasks.view_all',
    'comments.add',
    'attachments.add',
    'time_logs.view_all',
    'time_logs.approve',
    'reports.view',
    'reports.export',
    'notifications.manage'
  ],
  member: [
    'users.view_all',
    'projects.create',
    'projects.edit',
    'tasks.create',
    'tasks.edit',
    'tasks.assign',
    'tasks.view_all',
    'comments.add',
    'attachments.add',
    'time_logs.view_all',
    'reports.view',
    'notifications.manage'
  ],
  guest: [
    'users.view_all',
    'tasks.view_all',
    'comments.add',
    'notifications.manage'
  ]
};

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
  requireExactRole?: boolean;
  facilityId?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  requireExactRole = false,
  facilityId
}) => {
  const { userRole, loading } = useUserRole(facilityId);

  // If loading, show children (allow access while loading)
  if (loading) {
    return <>{children}</>;
  }

  // If no user role after loading, show fallback
  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check role-based access
  if (requiredRole) {
    const userRoleLevel = ROLE_HIERARCHY[userRole];
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];

    if (requireExactRole) {
      // Require exact role match
      if (userRole !== requiredRole) {
        return <>{fallback}</>;
      }
    } else {
      // Require role level or higher
      if (userRoleLevel < requiredRoleLevel) {
        return <>{fallback}</>;
      }
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    if (!userPermissions.includes(requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// Hook for checking permissions
export const usePermissions = (facilityId?: string) => {
  const { userRole, loading, error, debugInfo } = useUserRole(facilityId);

  const hasPermission = (permission: Permission): boolean => {
    // If loading, allow access (return true)
    if (loading) return true;
    
    // If no user role after loading, deny access
    if (!userRole) return false;
    
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  };

  const hasRole = (role: UserRole, requireExact = false): boolean => {
    // If loading, allow access (return true)
    if (loading) return true;
    
    // If no user role after loading, deny access
    if (!userRole) return false;
    
    if (requireExact) {
      return userRole === role;
    }
    
    const userRoleLevel = ROLE_HIERARCHY[userRole];
    const requiredRoleLevel = ROLE_HIERARCHY[role];
    return userRoleLevel >= requiredRoleLevel;
  };

  const canManageUsers = (): boolean => {
    return hasPermission('users.invite') || hasPermission('users.remove') || hasPermission('users.change_roles');
  };

  const canManageProjects = (): boolean => {
    return hasPermission('projects.create') || hasPermission('projects.delete');
  };

  const canManageTasks = (): boolean => {
    return hasPermission('tasks.create') || hasPermission('tasks.delete');
  };

  return {
    hasPermission,
    hasRole,
    canManageUsers,
    canManageProjects,
    canManageTasks,
    userRole,
    loading,
    isOwner: userRole === 'owner',
    isManager: userRole === 'manager',
    isMember: userRole === 'member',
    isGuest: userRole === 'guest'
  };
};

// Role badge component for displaying user roles
interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  size = 'md', 
  showIcon = true, 
  className = '' 
}) => {
  const roleConfig = {
    owner: {
      label: 'Owner',
      color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
      icon: '👑'
    },
    manager: {
      label: 'Manager',
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      icon: '👔'
    },
    member: {
      label: 'Member',
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      icon: '👤'
    },
    guest: {
      label: 'Guest',
      color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
      icon: '👥'
    }
  };

  const config = roleConfig[role];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${sizeClasses[size]}
        ${config.color}
        ${className}
      `}
    >
      {showIcon && <span className="text-xs">{config.icon}</span>}
      {config.label}
    </span>
  );
};

// Permission denied component
interface PermissionDeniedProps {
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  message?: string;
  isDarkMode?: boolean;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  requiredPermission,
  requiredRole,
  message,
  isDarkMode = false
}) => {
  const defaultMessage = requiredRole 
    ? `This action requires ${requiredRole} role or higher`
    : requiredPermission
    ? `You don't have permission to perform this action`
    : 'Access denied';

  return (
    <div className={`
      flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed
      ${isDarkMode 
        ? 'bg-gray-800 border-gray-600 text-gray-300' 
        : 'bg-gray-50 border-gray-300 text-gray-600'
      }
    `}>
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
      <p className="text-center text-sm">
        {message || defaultMessage}
      </p>
    </div>
  );
};
