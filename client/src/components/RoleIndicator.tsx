import React from 'react';
import { Crown, Shield, User, Users, ChevronDown } from 'lucide-react';
import { RoleBadge, usePermissions, UserRole } from './RoleGuard';
import { useUserRole } from '../hooks/useUserRole';

interface RoleIndicatorProps {
  isDarkMode?: boolean;
  showDetails?: boolean;
  className?: string;
  facilityId?: string;
}

const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  isDarkMode = false,
  showDetails = false,
  className = '',
  facilityId
}) => {
  const { userRole, loading } = useUserRole(facilityId);

  if (loading || !userRole) {
    return null;
  }

  const roleConfig = {
    owner: {
      icon: Crown,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Full facility control'
    },
    manager: {
      icon: Shield,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Manage users and projects'
    },
    member: {
      icon: User,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Create and manage tasks'
    },
    guest: {
      icon: Users,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      description: 'Read-only access'
    }
  };

  const config = roleConfig[userRole as UserRole];
  const IconComponent = config.icon;

  if (showDetails) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          ${config.bgColor}
        `}>
          <IconComponent className={`w-4 h-4 ${config.color}`} />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Your Role
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {config.description}
            </div>
          </div>
        </div>
        <RoleBadge role={userRole as UserRole} size="sm" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`
        flex items-center gap-2 px-2 py-1 rounded-md
        ${config.bgColor}
      `}>
        <IconComponent className={`w-4 h-4 ${config.color}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </span>
      </div>
    </div>
  );
};

// Compact role indicator for headers
export const CompactRoleIndicator: React.FC<{ isDarkMode?: boolean; facilityId?: string }> = ({ isDarkMode = false, facilityId }) => {
  const { userRole, loading } = useUserRole(facilityId);

  if (loading || !userRole) return null;

  const getRoleIcon = () => {
    switch (userRole) {
      case 'owner':
        return <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'member':
        return <User className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'guest':
        return <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      default:
        return <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center gap-1">
      {getRoleIcon()}
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </span>
    </div>
  );
};

// Role-based action button wrapper
interface RoleActionButtonProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  className?: string;
}

export const RoleActionButton: React.FC<RoleActionButtonProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  className = ''
}) => {
  const { hasPermission, hasRole } = usePermissions();

  const hasAccess = () => {
    if (requiredRole && !hasRole(requiredRole)) return false;
    if (requiredPermission && !hasPermission(requiredPermission as any)) return false;
    return true;
  };

  if (!hasAccess()) {
    return <>{fallback}</>;
  }

  return <div className={className}>{children}</div>;
};

export default RoleIndicator;
