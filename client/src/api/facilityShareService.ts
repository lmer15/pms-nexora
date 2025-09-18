import api from './api';

export interface FacilityMember {
  id: string;
  relationshipId: string;
  name: string;
  email: string;
  username: string;
  role: string;
  joinedAt: string;
  profilePicture: string | null;
  avatarColor: string;
  isOwner: boolean;
}

export interface ShareLink {
  id: string;
  linkId: string;
  url: string;
  role: string;
  expiresAt: string | null;
  usageCount: number;
}

export interface JoinRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    avatarColor: string;
    profilePicture: string | null;
  };
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
}

export interface SearchUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
}

class FacilityShareService {
  // Search users by email
  async searchUsers(query: string): Promise<{ users: SearchUser[] }> {
    try {
      const response = await api.get('/facilities/search/users', {
        params: { query }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  }

  // Send invitation by email
  async sendInvitation(facilityId: string, email: string, role: string = 'member'): Promise<{ message: string; invitation: Invitation }> {
    try {
      const response = await api.post(`/facilities/${facilityId}/invitations`, {
        email: email.trim(),
        role
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send invitation');
    }
  }

  // Get facility members
  async getFacilityMembers(facilityId: string): Promise<{ members: FacilityMember[]; totalCount: number }> {
    try {
      const response = await api.get(`/facilities/${facilityId}/members`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch facility members');
    }
  }

  // Update member role
  async updateMemberRole(facilityId: string, targetUserId: string, newRole: string): Promise<{ message: string; userId: string; newRole: string }> {
    try {
      const response = await api.put(`/facilities/${facilityId}/members/role`, {
        targetUserId,
        newRole
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update member role');
    }
  }

  // Remove member from facility
  async removeMember(facilityId: string, targetUserId: string): Promise<{ message: string; userId: string }> {
    try {
      const response = await api.delete(`/facilities/${facilityId}/members`, {
        data: { targetUserId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove member');
    }
  }

  // Generate share link
  async generateShareLink(facilityId: string, role: string = 'member', expirationDays?: number): Promise<{ message: string; shareLink: ShareLink }> {
    try {
      const response = await api.post(`/facilities/${facilityId}/share-link`, {
        role,
        expirationDays
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate share link');
    }
  }

  // Get active share link
  async getShareLink(facilityId: string): Promise<{ shareLink: ShareLink }> {
    try {
      const response = await api.get(`/facilities/${facilityId}/share-link`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('No active share link found');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch share link');
    }
  }

  // Update share link role
  async updateShareLinkRole(facilityId: string, role: string): Promise<{ message: string; role: string }> {
    try {
      const response = await api.put(`/facilities/${facilityId}/share-link/role`, {
        role
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update share link role');
    }
  }

  // Deactivate share link
  async deactivateShareLink(facilityId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/facilities/${facilityId}/share-link`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to deactivate share link');
    }
  }

  // Join facility via share link (direct join for invitations)
  async joinViaShareLink(linkId: string): Promise<{ message: string; facility: any; role: string }> {
    try {
      const response = await api.post(`/facilities/join/${linkId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join facility');
    }
  }

  // Request to join facility via share link (creates join request)
  async requestToJoinViaShareLink(linkId: string, message?: string): Promise<{ message: string; joinRequest: any }> {
    try {
      const response = await api.post(`/facilities/request-join/${linkId}`, {
        message: message || ''
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit join request');
    }
  }

  // Get join requests for facility
  async getJoinRequests(facilityId: string, status: string = 'pending'): Promise<{ joinRequests: JoinRequest[]; totalCount: number }> {
    try {
      const response = await api.get(`/facilities/${facilityId}/join-requests`, {
        params: { status }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch join requests');
    }
  }

  // Approve join request
  async approveJoinRequest(facilityId: string, requestId: string, assignedRole: string = 'member'): Promise<{ message: string; requestId: string; assignedRole: string }> {
    try {
      const response = await api.post(`/facilities/${facilityId}/join-requests/${requestId}/approve`, {
        assignedRole
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve join request');
    }
  }

  // Reject join request
  async rejectJoinRequest(facilityId: string, requestId: string, rejectionReason?: string): Promise<{ message: string; requestId: string }> {
    try {
      const response = await api.post(`/facilities/${facilityId}/join-requests/${requestId}/reject`, {
        rejectionReason
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reject join request');
    }
  }

  // Leave facility
  async leaveFacility(facilityId: string): Promise<{ message: string }> {
    try {
      const response = await api.post(`/facilities/${facilityId}/leave`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to leave facility');
    }
  }

  // Get invitation details by token
  async getInvitationDetails(token: string): Promise<{ invitation: any }> {
    try {
      const response = await api.get(`/facilities/invitations/${token}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Invalid or expired invitation');
    }
  }

  // Accept invitation
  async acceptInvitation(token: string): Promise<{ message: string; facility: any; role: string }> {
    try {
      const response = await api.post(`/facilities/invitations/${token}/accept`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to accept invitation');
    }
  }

  // Reject invitation
  async rejectInvitation(token: string): Promise<{ message: string }> {
    try {
      const response = await api.post(`/facilities/invitations/${token}/reject`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reject invitation');
    }
  }

  // Copy link to clipboard
  async copyLinkToClipboard(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        throw new Error('Failed to copy link to clipboard');
      }
      document.body.removeChild(textArea);
    }
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Validate role
  validateRole(role: string): boolean {
    const validRoles = ['admin', 'member', 'guest'];
    return validRoles.includes(role);
  }
}

export const facilityShareService = new FacilityShareService();
