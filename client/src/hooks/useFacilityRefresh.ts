import { useFacility } from '../context/FacilityContext';

/**
 * Custom hook that provides facility refresh functionality
 * This ensures that facility lists are updated immediately after membership changes
 */
export const useFacilityRefresh = () => {
  const { refreshFacilities } = useFacility();

  /**
   * Refresh facilities and show a success message
   * @param message - Optional success message to show
   */
  const refreshWithMessage = async (message?: string) => {
    try {
      await refreshFacilities();
      if (message) {
        // You could integrate with a toast notification system here
        // Message logged for debugging purposes
      }
    } catch (error) {
      console.error('Failed to refresh facilities:', error);
    }
  };

  return {
    refreshFacilities,
    refreshWithMessage
  };
};
