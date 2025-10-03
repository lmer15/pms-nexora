import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { facilityShareService } from '../api/facilityShareService';
import { facilityService } from '../api/facilityService';
import { UserRole } from '../components/RoleGuard';
import { roleUtils } from '../utils/roleUtils';

// Cache for user roles to avoid repeated API calls
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const useUserRole = (facilityId?: string) => {
  const { user } = useAuth();
  
  // Use provided facilityId, don't fall back to currentFacility to avoid confusion
  const targetFacilityId = facilityId;
  
  // Debug logging removed to prevent console spam
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  const fetchUserRole = useCallback(async () => {
    if (!targetFacilityId || !user || isFetchingRef.current) {
      if (!targetFacilityId) {
        console.warn('useUserRole: No facility ID provided');
        setUserRole(null);
        setLoading(false);
        setError('No facility ID provided');
      }
      return;
    }

    // Check cache first
    const cacheKey = `${targetFacilityId}-${user.uid}`;
    const cached = roleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Use cached role (no logging needed)
      setUserRole(cached.role);
      setLoading(false);
      setError(null);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    // Get facility info first to check ownership
    let facility;
    try {
      facility = await facilityService.getById(targetFacilityId);
    } catch (facilityError) {
      console.error('Error fetching facility info:', facilityError);
      setError('Failed to fetch facility information');
      setLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      // ALWAYS check if user is the facility owner first (most reliable check)
      if (facility.ownerId === user.uid) {
        const role = 'owner' as UserRole;
        setUserRole(role);
        roleCache.set(cacheKey, { role, timestamp: Date.now() });
        setLoading(false);
        return;
      }
      
    let role: UserRole;
    
    try {
      const userRoleData = await facilityService.getUserRole(targetFacilityId);
      role = userRoleData.role as UserRole;
    } catch (userRoleError) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        fetchTimeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 10000); // 10 second timeout
      });

      const membersPromise = facilityShareService.getFacilityMembers(targetFacilityId);
      
      const response = await Promise.race([membersPromise, timeoutPromise]);
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      // Safety check for response
      if (!response || !response.members) {
        console.error('Invalid response from getFacilityMembers:', response);
        throw new Error('Invalid response from facility members API');
      }
      
      const currentUserMember = response.members.find((member: any) => member.id === user.uid);
      
      if (currentUserMember) {
        role = currentUserMember.role as UserRole;
      } else {
        role = 'guest' as UserRole;
      }
    }
    
    setUserRole(role);
    roleCache.set(cacheKey, { role, timestamp: Date.now() });
    setError(null);
    
  } catch (err: any) {
    console.error('Error fetching user role:', err);
    
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    // Fallback to owner check on error
    if (facility.ownerId === user.uid) {
      const role = 'owner' as UserRole;
      setUserRole(role);
      roleCache.set(cacheKey, { role, timestamp: Date.now() });
      setError(null);
    } else {
      const role = 'guest' as UserRole;
      setUserRole(role);
      setError(err.message || 'Failed to fetch user role');
    }
  } finally {
    setLoading(false);
    isFetchingRef.current = false;
  }
  }, [targetFacilityId, user]);

  useEffect(() => {
    if (!targetFacilityId || !user) {
      setUserRole(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Reset fetch state when facility or user changes
    setUserRole(null);
    setError(null);

    // Fetch user role
    fetchUserRole();
  }, [targetFacilityId, user?.uid, fetchUserRole]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const refetch = useCallback(() => {
    // Clear cache for this user/facility combination
    const cacheKey = `${targetFacilityId}-${user?.uid}`;
    roleCache.delete(cacheKey);
    
    setUserRole(null);
    setError(null);
    setLoading(true);
    fetchUserRole();
  }, [fetchUserRole, targetFacilityId, user?.uid]);

  // Function to invalidate role cache (useful when roles change)
  const invalidateCache = useCallback(() => {
    const cacheKey = `${targetFacilityId}-${user?.uid}`;
    roleCache.delete(cacheKey);
    
    // Also clear facility service cache
    if (targetFacilityId) {
      facilityService.clearUserRoleCache(targetFacilityId);
      facilityShareService.clearFacilityMembersCache(targetFacilityId);
    }
  }, [targetFacilityId, user?.uid]);

  // Debug information removed to prevent console spam

  return {
    userRole,
    loading,
    error,
    refetch,
    invalidateCache,
    // Debug utilities
    debugInfo: {
      userRole,
      loading,
      error,
      facilityId: targetFacilityId,
      userId: user?.uid,
      isOwner: false, // Will be determined during role fetch
      roleLevel: userRole ? roleUtils.getRoleLevel(userRole) : 0,
      displayName: userRole ? roleUtils.getRoleDisplayName(userRole) : 'Unknown'
    }
  };
};
