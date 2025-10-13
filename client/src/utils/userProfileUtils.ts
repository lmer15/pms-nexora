import React from 'react';

// Utility functions for managing user profile updates across the system

/**
 * Triggers a global event to refresh user profile data across all components
 * This should be called when user profile information is updated
 */
export const triggerUserProfileRefresh = (userId: string) => {
  const event = new CustomEvent('userProfileRefresh', {
    detail: { userId }
  });
  window.dispatchEvent(event);
};

/**
 * Hook to listen for user profile refresh events
 * Components can use this to refresh their user profile data
 */
export const useUserProfileRefresh = (callback: (userId: string) => void) => {
  React.useEffect(() => {
    const handleRefresh = (event: any) => {
      const { userId } = event.detail;
      callback(userId);
    };

    window.addEventListener('userProfileRefresh', handleRefresh);
    return () => window.removeEventListener('userProfileRefresh', handleRefresh);
  }, [callback]);
};

/**
 * Triggers a global event to refresh all user profiles
 * This should be called when the current user's profile is updated
 */
export const triggerAllUserProfilesRefresh = () => {
  const event = new CustomEvent('allUserProfilesRefresh');
  window.dispatchEvent(event);
};
