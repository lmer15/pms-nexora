import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Crown, UserCheck, UserX, AlertTriangle, CheckCircle } from 'lucide-react';
import { facilityShareService, FacilityMember } from '../api/facilityShareService';
import { RoleBadge, RoleGuard, usePermissions, UserRole } from './RoleGuard';
import { useAuth } from '../context/AuthContext';
import { useFacility } from '../context/FacilityContext';

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  isDarkMode: boolean;
}

interface MemberWithActions extends FacilityMember {
  isUpdating?: boolean;
  error?: string;
}

const RoleManagementModal: React.FC<RoleManagementModalProps> = ({
  isOpen,
  onClose,
  facilityId,
  isDarkMode
}) => {
  const { user } = useAuth();
  const { hasPermission, isOwner, isManager, userRole } = usePermissions(facilityId);
  
  const [members, setMembers] = useState<MemberWithActions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberWithActions | null>(null);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<MemberWithActions | null>(null);

  const allRoles: { value: UserRole; label: string; description: string; icon: string }[] = [
    {
      value: 'owner',
      label: 'Owner',
      description: 'Full control over facility, can manage everything',
      icon: '👑'
    },
    {
      value: 'manager',
      label: 'Manager',
      description: 'Can manage users, projects, and tasks',
      icon: '👔'
    },
    {
      value: 'member',
      label: 'Member',
      description: 'Can create and manage tasks, limited project access',
      icon: '👤'
    },
    {
      value: 'guest',
      label: 'Guest',
      description: 'Read-only access with limited interaction',
      icon: '👥'
    }
  ];

  const roleOptions: { value: UserRole; label: string; description: string; icon: string }[] = [
    {
      value: 'manager',
      label: 'Manager',
      description: 'Can manage users, projects, and tasks',
      icon: '👔'
    },
    {
      value: 'member',
      label: 'Member',
      description: 'Can create and manage tasks, limited project access',
      icon: '👤'
    },
    {
      value: 'guest',
      label: 'Guest',
      description: 'Read-only access with limited interaction',
      icon: '👥'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, facilityId]);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error messages after 7 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await facilityShareService.getFacilityMembers(facilityId);
      
      // Deduplicate members by ID to prevent duplicate keys
      const uniqueMembers = response.members.reduce((acc: FacilityMember[], member) => {
        if (!acc.find(m => m.id === member.id)) {
          acc.push(member);
        }
        return acc;
      }, []);
      
      const membersWithActions = uniqueMembers.map(member => ({
        ...member,
        isUpdating: false,
        error: undefined
      }));
      
      console.log('Loaded members:', membersWithActions.map(m => ({ id: m.id, name: m.name, role: m.role })));
      setMembers(membersWithActions);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (member: MemberWithActions) => {
    setSelectedMember(member);
    setNewRole(member.role as UserRole);
    setShowRoleChangeModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedMember) return;

    try {
      setMembers(prev => prev.map(m => 
        m.id === selectedMember.id 
          ? { ...m, isUpdating: true, error: undefined }
          : m
      ));

      console.log('Updating member role:', {
        facilityId,
        targetUserId: selectedMember.id,
        newRole,
        member: selectedMember
      });

      await facilityShareService.updateMemberRole(facilityId, selectedMember.id, newRole);
      
      setMembers(prev => prev.map(m => 
        m.id === selectedMember.id 
          ? { ...m, role: newRole, isUpdating: false }
          : m
      ));

      setSuccess(`Successfully updated ${selectedMember.name}'s role to ${newRole}`);
      setShowRoleChangeModal(false);
      setSelectedMember(null);
    } catch (err: any) {
      setMembers(prev => prev.map(m => 
        m.id === selectedMember.id 
          ? { ...m, isUpdating: false, error: err.message }
          : m
      ));
    }
  };

  const handleRemoveMember = (member: MemberWithActions) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      setMembers(prev => prev.map(m => 
        m.id === memberToDelete.id 
          ? { ...m, isUpdating: true, error: undefined }
          : m
      ));

      await facilityShareService.removeMember(facilityId, memberToDelete.id);
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      setSuccess(`Successfully removed ${memberToDelete.name} from the facility`);
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (err: any) {
      setMembers(prev => prev.map(m => 
        m.id === memberToDelete.id 
          ? { ...m, isUpdating: false, error: err.message }
          : m
      ));
    }
  };

  const canChangeRole = (targetMember: MemberWithActions): boolean => {
    if (!hasPermission('users.change_roles')) return false;
    if (targetMember.isOwner && !isOwner) return false;
    if (targetMember.id === user?.uid) return false; // Can't change own role
    return true;
  };

  const canRemoveMember = (targetMember: MemberWithActions): boolean => {
    if (!hasPermission('users.remove')) return false;
    if (targetMember.isOwner && !isOwner) return false;
    if (targetMember.id === user?.uid) return false; // Can't remove self
    return true;
  };

  const getRoleChangeOptions = (): typeof roleOptions => {
    if (isOwner) {
      return roleOptions; // Owner can assign any role
    }
    if (isManager) {
      return roleOptions; // Manager can assign any available role
    }
    return []; // Others can't change roles
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10002] p-4">
      <div className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden
        ${isDarkMode ? 'border border-gray-700' : 'border border-gray-200'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Role Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage member roles and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-700 dark:text-green-300 text-sm flex-1">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Role Legend */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allRoles.map((role) => (
                <div key={role.value} className="flex items-center gap-3">
                  <span className="text-lg">{role.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {role.label}
                      </span>
                      <RoleBadge role={role.value} size="sm" showIcon={false} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading members...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Members Found</h3>
              <p className="text-gray-500 dark:text-gray-400">This facility doesn't have any members yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Facility Members ({members.length})
                </h3>
              </div>
              
              <div className="grid gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`
                      p-4 rounded-lg border transition-all duration-200
                      ${isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      ${member.isUpdating ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full flex-shrink-0 relative overflow-hidden">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`
                              absolute inset-0 flex items-center justify-center text-white font-semibold text-lg
                              ${member.avatarColor || 'bg-gradient-to-br from-blue-500 to-blue-600'}
                              ${member.profilePicture ? 'hidden' : 'flex'}
                            `}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* Member Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {member.name}
                            </h4>
                            {member.isOwner && (
                              <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {member.email}
                          </p>
                          {member.error && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {member.error}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <RoleBadge role={member.role as UserRole} />
                        
                        <div className="flex items-center gap-2">
                          {canChangeRole(member) && (
                            <button
                              onClick={() => handleRoleChange(member)}
                              disabled={member.isUpdating}
                              className={`
                                p-2 rounded-lg transition-all duration-200 text-sm font-medium
                                ${isDarkMode
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 shadow-sm hover:shadow-md'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                              title="Change role"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {canRemoveMember(member) && (
                            <button
                              onClick={() => handleRemoveMember(member)}
                              disabled={member.isUpdating}
                              className={`
                                p-2 rounded-lg transition-all duration-200 text-sm font-medium
                                ${isDarkMode
                                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25'
                                  : 'bg-red-100 hover:bg-red-200 text-red-700 shadow-sm hover:shadow-md'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                              title="Remove member"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleChangeModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10003] p-4">
          <div className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg
            ${isDarkMode ? 'border border-gray-700' : 'border border-gray-200'}
          `}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full relative overflow-hidden">
                  {selectedMember.profilePicture ? (
                    <img
                      src={selectedMember.profilePicture}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`
                      absolute inset-0 flex items-center justify-center text-white font-semibold
                      ${selectedMember.avatarColor || 'bg-gradient-to-br from-blue-500 to-blue-600'}
                      ${selectedMember.profilePicture ? 'hidden' : 'flex'}
                    `}
                  >
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Change Role
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    for {selectedMember.name}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {getRoleChangeOptions().map((role) => (
                  <label
                    key={role.value}
                    className={`
                      flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200
                      ${newRole === role.value
                        ? isDarkMode
                          ? 'bg-blue-900/50 border-blue-600 shadow-lg shadow-blue-500/10'
                          : 'bg-blue-50 border-blue-300 shadow-md shadow-blue-500/10'
                        : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-750'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={newRole === role.value}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="sr-only"
                    />
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-lg
                      ${newRole === role.value
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {role.label}
                        </span>
                        <RoleBadge role={role.value} size="sm" showIcon={false} />
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {role.description}
                      </div>
                    </div>
                    {newRole === role.value && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleChangeModal(false)}
                  className={`
                    flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                    }
                  `}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10004] p-4">
          <div className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md
            ${isDarkMode ? 'border border-gray-700' : 'border border-gray-200'}
          `}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full relative overflow-hidden">
                  {memberToDelete.profilePicture ? (
                    <img
                      src={memberToDelete.profilePicture}
                      alt={memberToDelete.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`
                      absolute inset-0 flex items-center justify-center text-white font-semibold text-lg
                      ${memberToDelete.avatarColor || 'bg-gradient-to-br from-blue-500 to-blue-600'}
                      ${memberToDelete.profilePicture ? 'hidden' : 'flex'}
                    `}
                  >
                    {memberToDelete.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Remove Member
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to remove <strong>{memberToDelete.name}</strong> from this facility?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  They will lose access to all facility resources and will need to be re-invited to regain access.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMemberToDelete(null);
                  }}
                  className={`
                    flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                    }
                  `}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMember}
                  disabled={memberToDelete.isUpdating}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {memberToDelete.isUpdating ? 'Removing...' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementModal;
