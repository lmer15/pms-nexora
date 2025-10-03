import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { LucideX, Copy, Trash2, UserPlus, AlertCircle, CheckCircle, Loader2, Search, User, X, Crown } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';
import { facilityShareService, FacilityMember, ShareLink, JoinRequest, SearchUser } from '../../../api/facilityShareService';
import { useFacility } from '../../../context/FacilityContext';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';

interface ShareFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  isDarkMode: boolean;
}

const roles = ['manager', 'member', 'guest'];
const roleDisplayNames = {
  owner: 'Owner',
  manager: 'Manager',
  member: 'Member', 
  guest: 'Guest'
};

interface SelectedUser {
  id?: string;
  email: string;
  name: string;
  role: string;
  isExistingUser: boolean;
  avatarColor?: string;
}

const ShareFacilityModal: React.FC<ShareFacilityModalProps> = ({ isOpen, onClose, facilityId, isDarkMode }) => {
  const { refreshFacilities } = useFacility();
  const { triggerMemberRefresh } = useFacilityRefresh();
  const [selectedTab, setSelectedTab] = useState<'members' | 'joinRequests'>('members');
  const [emailOrName, setEmailOrName] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  
  // Data states
  const [members, setMembers] = useState<FacilityMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  
  // User search states
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false);
  const [isLoadingShareLink, setIsLoadingShareLink] = useState(false);
  
  // Error and success states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && facilityId) {
      loadMembers();
      loadJoinRequests();
      loadShareLink();
    }
  }, [isOpen, facilityId]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await facilityShareService.getFacilityMembers(facilityId);
      
      // Deduplicate members by ID to prevent duplicate users
      const uniqueMembers = response.members.reduce((acc: FacilityMember[], member) => {
        if (!acc.find(m => m.id === member.id)) {
          acc.push(member);
        }
        return acc;
      }, []);
      
      setMembers(uniqueMembers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadJoinRequests = async () => {
    setIsLoadingJoinRequests(true);
    try {
      const response = await facilityShareService.getJoinRequests(facilityId);
      setJoinRequests(response.joinRequests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingJoinRequests(false);
    }
  };

  const loadShareLink = async () => {
    setIsLoadingShareLink(true);
    try {
      const response = await facilityShareService.getShareLink(facilityId);
      setShareLink(response.shareLink);
    } catch (err: any) {
      // It's okay if no share link exists
      if (!err.message.includes('No active share link found')) {
        setError(err.message);
      }
    } finally {
      setIsLoadingShareLink(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailOrName(value);
    setError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await facilityShareService.searchUsers(value.trim());
        setSearchResults(response.users);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle user selection from search results
  const handleUserSelect = (user: SearchUser) => {
    const newUser: SelectedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: selectedRole,
      isExistingUser: true,
      avatarColor: user.avatarColor
    };

    // Check if user is already selected
    if (!selectedUsers.find(u => u.email === user.email)) {
      setSelectedUsers([...selectedUsers, newUser]);
    }

    setEmailOrName('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Handle adding email that's not in search results
  const handleAddEmail = () => {
    const email = emailOrName.trim();
    if (!email) return;

    // Validate email format
    if (!facilityShareService.validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email is already selected
    if (selectedUsers.find(u => u.email === email)) {
      setError('This email is already added');
      return;
    }

    const newUser: SelectedUser = {
      email: email,
      name: email.split('@')[0],
      role: selectedRole,
      isExistingUser: false
    };

    setSelectedUsers([...selectedUsers, newUser]);
    setEmailOrName('');
    setError(null);
  };

  // Remove selected user
  const removeSelectedUser = (email: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.email !== email));
  };

  // Send multiple invitations
  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0 && !emailOrName.trim()) {
      setError('Please select at least one user to invite or enter an email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let usersToInvite = [...selectedUsers];
      
      // If there's text in the input field, add it as well
      if (emailOrName.trim()) {
        if (!facilityShareService.validateEmail(emailOrName.trim())) {
          setError('Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        
        usersToInvite.push({
          email: emailOrName.trim(),
          name: emailOrName.split('@')[0],
          role: selectedRole,
          isExistingUser: false
        });
      }

      const results = await Promise.allSettled(
        usersToInvite.map(user =>
          facilityShareService.sendInvitation(facilityId, user.email, user.role)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        setSuccess(`Successfully sent ${successful} invitation${successful > 1 ? 's' : ''}`);
        setSelectedUsers([]);
        setEmailOrName('');
        loadMembers(); // Refresh members list
      }

      if (failed > 0) {
        // Check if any failures are due to already sent invitations
        const alreadySentErrors = results
          .filter(r => r.status === 'rejected')
          .map(r => r.reason?.message || r.reason)
          .filter(msg => msg && msg.includes('already sent'));
        
        if (alreadySentErrors.length > 0) {
          setError(`Some invitations were already sent to these users. Please check the email addresses.`);
        } else {
          setError(`Failed to send ${failed} invitation${failed > 1 ? 's' : ''}`);
        }
      }

    } catch (error: any) {
      setError(error.message || 'Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!emailOrName.trim()) {
      setError('Email address is required');
      return;
    }

    if (!facilityShareService.validateEmail(emailOrName)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await facilityShareService.sendInvitation(facilityId, emailOrName, selectedRole);
      setSuccess('Invitation sent successfully!');
      setEmailOrName('');
      // Refresh members in case they were already registered
      loadMembers();
    } catch (err: any) {
      // Handle specific error messages more gracefully
      if (err.message && err.message.includes('already sent')) {
        setError('An invitation has already been sent to this email address.');
      } else if (err.message && err.message.includes('already a member')) {
        setError('This user is already a member of the facility.');
      } else if (err.message && err.message.includes('cannot invite yourself')) {
        setError('You cannot invite yourself to the facility.');
      } else {
        setError(err.message || 'Failed to send invitation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!shareLink || !confirm('Are you sure you want to delete this share link?')) {
      return;
    }

    try {
      await facilityShareService.deactivateShareLink(facilityId);
      setShareLink(null);
      setSuccess('Share link deleted successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerateShareLink = async () => {
    setIsLoadingShareLink(true);
    try {
      const response = await facilityShareService.generateShareLink(facilityId, selectedRole);
      setShareLink(response.shareLink);
      setSuccess('Share link generated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingShareLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    try {
      await facilityShareService.copyLinkToClipboard(shareLink.url);
      setSuccess('Link copied to clipboard!');
    } catch (err: any) {
      setError('Failed to copy link to clipboard');
    }
  };


  const handleUpdateShareLinkRole = async (newRole: string) => {
    if (!shareLink) return;

    try {
      await facilityShareService.updateShareLinkRole(facilityId, newRole);
      setShareLink({ ...shareLink, role: newRole });
      setSuccess('Share link role updated successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveJoinRequest = async (requestId: string, assignedRole: string = 'member') => {
    try {
      await facilityShareService.approveJoinRequest(facilityId, requestId, assignedRole);
      setSuccess('Join request approved successfully!');
      
      // Immediately refresh facility list so the new member sees the facility
      await refreshFacilities();
      
      loadJoinRequests();
      loadMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      await facilityShareService.rejectJoinRequest(facilityId, requestId);
      setSuccess('Join request rejected successfully!');
      loadJoinRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
      <div className={`w-full max-w-lg mx-4 rounded-lg shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`px-6 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <h2 className="text-lg font-semibold">Share facility</h2>
          <button onClick={onClose} aria-label="Close modal" className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <LucideX size={20} />
          </button>
        </div>

        {/* Error/Success Messages */}
        {(error || success) && (
          <div className={`px-6 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            {error && (
              <div className="flex items-center space-x-2 text-red-500 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center space-x-2 text-green-500 text-sm">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Email input with search and multiple selection */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          {/* Selected Users Display */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Selected users ({selectedUsers.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.email}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                      isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-gray-500 dark:bg-gray-600`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({roleDisplayNames[user.role as keyof typeof roleDisplayNames]})
                    </span>
                    {!user.isExistingUser && (
                      <span className={`text-xs px-1 rounded ${isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                        New
                      </span>
                    )}
                    <button
                      onClick={() => removeSelectedUser(user.email)}
                      className={`ml-1 hover:bg-red-500 hover:text-white rounded-full p-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Input with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search by email or name..."
                  value={emailOrName}
                  onChange={handleSearchChange}
                  className={`flex-grow pr-8 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : ''}`}
                  disabled={isLoading}
                />
                {isSearching && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              
              <select
                value={selectedRole}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRole(e.target.value)}
                className={`border rounded-md px-2 py-1 text-sm focus:ring-brand ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'}`}
                disabled={isLoading}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{roleDisplayNames[role as keyof typeof roleDisplayNames]}</option>
                ))}
              </select>
              
              <Button 
                variant="primary" 
                size="sm" 
                disabled={(selectedUsers.length === 0 && !emailOrName.trim()) || isLoading} 
                className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                onClick={handleSendInvitations}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Invite {selectedUsers.length > 0 || emailOrName.trim() ? `(${selectedUsers.length + (emailOrName.trim() ? 1 : 0)})` : ''}
              </Button>
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && (searchResults.length > 0 || emailOrName.trim().length >= 2) && (
              <div className={`absolute top-full left-0 right-0 mt-1 rounded-md shadow-lg z-[10000] max-h-60 overflow-y-auto ${
                isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'
              }`}>
                {searchResults.length > 0 ? (
                  <>
                    <div className={`px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
                      Existing Users
                    </div>
                    {searchResults.map((user) => (
                      <button
                        key={`search-${user.id}`}
                        onClick={() => handleUserSelect(user)}
                        className={`w-full px-3 py-2 text-left hover:bg-opacity-50 flex items-center space-x-3 ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        disabled={selectedUsers.some(u => u.email === user.email)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-gray-500 dark:bg-gray-600`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                        </div>
                        {selectedUsers.some(u => u.email === user.email) && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </button>
                    ))}
                  </>
                ) : null}
                
                {/* Add email option if it's a valid email and not in results */}
                {emailOrName.trim().length >= 2 && 
                 facilityShareService.validateEmail(emailOrName.trim()) && 
                 !searchResults.some(u => u.email.toLowerCase() === emailOrName.toLowerCase().trim()) && (
                  <>
                    {searchResults.length > 0 && <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`} />}
                    <div className={`px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
                      New User
                    </div>
                    <button
                      onClick={handleAddEmail}
                      className={`w-full px-3 py-2 text-left hover:bg-opacity-50 flex items-center space-x-3 ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-gray-500`}>
                        <User size={12} />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium">{emailOrName.trim()}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          It seems like this user doesn't have a Nexora account
                        </p>
                      </div>
                    </button>
                  </>
                )}
                
                {/* No results message */}
                {searchResults.length === 0 && emailOrName.trim().length >= 2 && !facilityShareService.validateEmail(emailOrName.trim()) && (
                  <div className={`px-3 py-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No users found. Enter a valid email address to send an invitation.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Link sharing section */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          {isLoadingShareLink ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin" />
              <span className="ml-2">Loading share link...</span>
            </div>
          ) : shareLink ? (
            <div className={`flex items-start justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
              <div className="flex items-start space-x-2">
                <svg
                  className={`w-6 h-6 mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div className="flex flex-col space-y-1">
                  <span>Anyone with the link can join as a {roleDisplayNames[shareLink.role as keyof typeof roleDisplayNames]}</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleCopyLink}
                      className="text-blue-500 hover:underline font-medium text-xs flex items-center space-x-1"
                    >
                      <Copy size={12} />
                      <span>Copy link</span>
                    </button>
                    <button 
                      onClick={handleDeleteLink}
                      className="text-red-500 hover:underline dark:text-red-400 dark:hover:text-red-300 font-medium text-xs flex items-center space-x-1 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Delete link</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right side: Permissions dropdown */}
              <div className="flex items-center space-x-2">
                <select
                  value={shareLink.role}
                  onChange={(e) => handleUpdateShareLinkRole(e.target.value)}
                  className={`${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{roleDisplayNames[role as keyof typeof roleDisplayNames]}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                No active share link. Generate one to allow others to join via link.
              </p>
              <Button 
                onClick={handleGenerateShareLink}
                variant="secondary"
                size="sm"
                className="text-blue-500 border-blue-500 hover:bg-blue-50"
              >
                Generate Share Link
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <button
            className={`flex-1 py-2 ${selectedTab === 'members' ? 'border-b-2 border-green-500 text-green-500' : ''}`}
            onClick={() => setSelectedTab('members')}
          >
            Facility members ({members.length})
          </button>
          <button
            className={`flex-1 py-2 ${selectedTab === 'joinRequests' ? 'border-b-2 border-green-500 text-green-500' : ''}`}
            onClick={() => setSelectedTab('joinRequests')}
          >
            Join requests ({joinRequests.length})
          </button>
        </div>

        {/* Members or Join Requests List */}
        <div className="flex-grow overflow-y-auto p-6 max-h-80">
          {selectedTab === 'members' ? (
            isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" />
                <span className="ml-2">Loading members...</span>
              </div>
            ) : members.length > 0 ? (
              <div>
                <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    💡 <strong>Tip:</strong> To change member roles, use the "Manage Roles" button in the facility header for detailed role management.
                  </p>
                </div>
                <ul className="space-y-3">
                {members.map((member) => (
                  <li key={`member-${member.id}`} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs bg-gray-500 dark:bg-gray-600 ${member.profilePicture ? 'hidden' : ''}`}
                      >
                        {member.name.charAt(0).toUpperCase()}{member.name.charAt(1)?.toUpperCase() || ''}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {member.name}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          @{member.username} • {roleDisplayNames[member.role as keyof typeof roleDisplayNames]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === 'owner' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        member.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        member.role === 'member' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {roleDisplayNames[member.role as keyof typeof roleDisplayNames]}
                      </span>
                      {member.isOwner && (
                        <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              </div>
            ) : (
              <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No members found</p>
            )
          ) : (
            isLoadingJoinRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" />
                <span className="ml-2">Loading join requests...</span>
              </div>
            ) : joinRequests.length > 0 ? (
              <ul className="space-y-3">
                {joinRequests.map((request) => (
                  <li key={request.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Profile Picture Display */}
                      <div className="w-8 h-8 rounded-full relative overflow-hidden flex-shrink-0">
                        {request.user.profilePicture ? (
                          <img
                            src={request.user.profilePicture}
                            alt={request.user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide the image and show fallback
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.fallback-initials') as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`fallback-initials absolute inset-0 flex items-center justify-center font-semibold text-white text-xs bg-gray-500 dark:bg-gray-600 ${request.user.profilePicture ? 'hidden' : 'flex'}`}
                        >
                          {request.user.name.charAt(0).toUpperCase()}{request.user.name.charAt(1)?.toUpperCase() || ''}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold">{request.user.name}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          @{request.user.username}
                        </p>
                        {request.message && (
                          <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleApproveJoinRequest(request.id)}
                        variant="secondary"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectJoinRequest(request.id)}
                        variant="destructive"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No join requests</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareFacilityModal;
