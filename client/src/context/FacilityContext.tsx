import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { facilityService, Facility } from '../api/facilityService';
import { useAuth } from './AuthContext';

interface FacilityContextType {
  facilities: Facility[];
  currentFacility: Facility | null;
  loading: boolean;
  error: string | null;
  loadFacilities: () => Promise<void>;
  setCurrentFacility: (facility: Facility | null) => void;
  setCurrentFacilityById: (facilityId: string) => void;
  refreshFacilities: () => Promise<void>;
  setFacilities: (facilities: Facility[]) => void;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

export const useFacility = () => {
  const context = useContext(FacilityContext);
  if (context === undefined) {
    throw new Error('useFacility must be used within a FacilityProvider');
  }
  return context;
};

interface FacilityProviderProps {
  children: ReactNode;
}

export const FacilityProvider: React.FC<FacilityProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [currentFacility, setCurrentFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFacilities = useCallback(async () => {
    if (!token) {
      setFacilities([]);
      setCurrentFacility(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await facilityService.getAll();
      setFacilities(data);
      if (data.length > 0) {
        setCurrentFacility(prev => prev || data[0]);
      } else {
        setCurrentFacility(null);
      }
    } catch (err: any) {
      console.error('FacilityContext: Error loading facilities:', err);
      console.error('FacilityContext: Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(err.message || 'Failed to load facilities');
      setFacilities([]);
      setCurrentFacility(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshFacilities = useCallback(async () => {
    await loadFacilities();
  }, [loadFacilities]);

  const setCurrentFacilityById = (facilityId: string) => {
    const facility = facilities.find(f => f.id === facilityId);
    if (facility) {
      setCurrentFacility(facility);
    }
  };

  // Load facilities when token changes
  useEffect(() => {
    if (token) {
      loadFacilities();
    } else {
      setFacilities([]);
      setCurrentFacility(null);
    }
  }, [token]); // Removed loadFacilities from dependencies to prevent infinite loop


  const value = {
    facilities,
    currentFacility,
    loading,
    error,
    loadFacilities,
    setCurrentFacility,
    setCurrentFacilityById,
    refreshFacilities,
    setFacilities,
  };

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
};
