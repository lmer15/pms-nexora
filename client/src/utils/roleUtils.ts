import { UserRole } from '../components/RoleGuard';

// Utility functions for role management and debugging

export const roleUtils = {
  // Get role hierarchy level
  getRoleLevel: (role: UserRole): number => {
    const hierarchy = {
      'owner': 4,
      'manager': 3,
      'member': 2,
      'guest': 1
    };
    return hierarchy[role] || 0;
  },

  // Check if user has required role level or higher
  hasRoleLevel: (userRole: UserRole, requiredRole: UserRole): boolean => {
    return roleUtils.getRoleLevel(userRole) >= roleUtils.getRoleLevel(requiredRole);
  },

  // Get role display name
  getRoleDisplayName: (role: UserRole): string => {
    const displayNames = {
      'owner': 'Owner',
      'manager': 'Manager', 
      'member': 'Member',
      'guest': 'Guest'
    };
    return displayNames[role] || 'Unknown';
  },

  // Get role color for UI
  getRoleColor: (role: UserRole, isDarkMode: boolean = false): string => {
    const colors = {
      owner: isDarkMode ? 'text-purple-400 bg-purple-900/30' : 'text-purple-600 bg-purple-100',
      manager: isDarkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-100',
      member: isDarkMode ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-100',
      guest: isDarkMode ? 'text-gray-400 bg-gray-900/30' : 'text-gray-600 bg-gray-100'
    };
    return colors[role] || colors.guest;
  },

  // Debug role information
  debugRole: (userRole: UserRole | null, loading: boolean, error: string | null) => {
    console.group('🔍 Role Debug Information');
    console.log('User Role:', userRole);
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('Role Level:', userRole ? roleUtils.getRoleLevel(userRole) : 'N/A');
    console.log('Display Name:', userRole ? roleUtils.getRoleDisplayName(userRole) : 'N/A');
    console.groupEnd();
  },

  // Validate role string
  isValidRole: (role: string): role is UserRole => {
    return ['owner', 'manager', 'member', 'guest'].includes(role);
  },

  // Get role permissions (for debugging)
  getRolePermissions: (role: UserRole): string[] => {
    const permissions = {
      owner: [
        'facility.manage', 'facility.delete', 'facility.transfer_ownership',
        'users.invite', 'users.remove', 'users.change_roles', 'users.view_all',
        'projects.create', 'projects.edit', 'projects.delete', 'projects.archive',
        'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign', 'tasks.view_all',
        'comments.add', 'attachments.add', 'time_logs.view_all', 'time_logs.approve',
        'reports.view', 'reports.export', 'notifications.manage'
      ],
      manager: [
        'facility.manage', 'users.invite', 'users.remove', 'users.change_roles', 'users.view_all',
        'projects.create', 'projects.edit', 'projects.delete', 'projects.archive',
        'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign', 'tasks.view_all',
        'comments.add', 'attachments.add', 'time_logs.view_all', 'time_logs.approve',
        'reports.view', 'reports.export', 'notifications.manage'
      ],
      member: [
        'users.view_all', 'projects.create', 'projects.edit',
        'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.view_all',
        'comments.add', 'attachments.add', 'time_logs.view_all',
        'reports.view', 'notifications.manage'
      ],
      guest: [
        'users.view_all', 'tasks.view_all', 'comments.add', 'notifications.manage'
      ]
    };
    return permissions[role] || [];
  }
};

// Hook for role debugging (development only)
export const useRoleDebug = (userRole: UserRole | null, loading: boolean, error: string | null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Role Debug:', { userRole, loading, error });
  }
  
  return {
    debugInfo: {
      userRole,
      loading,
      error,
      roleLevel: userRole ? roleUtils.getRoleLevel(userRole) : 0,
      displayName: userRole ? roleUtils.getRoleDisplayName(userRole) : 'Unknown',
      permissions: userRole ? roleUtils.getRolePermissions(userRole) : []
    }
  };
};
