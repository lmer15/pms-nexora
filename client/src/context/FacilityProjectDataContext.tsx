import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Column } from '../pages/Facility/types';

interface FacilityProjectData {
  projects: any[];
  columns: Column[];
  lastUpdated: number;
}

interface FacilityProjectDataContextType {
  getFacilityData: (facilityId: string) => FacilityProjectData | null;
  setFacilityData: (facilityId: string, projects: any[], columns: Column[]) => void;
  updateFacilityProjects: (facilityId: string, projects: any[]) => void;
  updateFacilityColumns: (facilityId: string, columns: Column[]) => void;
  clearFacilityData: (facilityId: string) => void;
  clearAllData: () => void;
}

const FacilityProjectDataContext = createContext<FacilityProjectDataContextType | undefined>(undefined);

export const useFacilityProjectData = () => {
  const context = useContext(FacilityProjectDataContext);
  if (context === undefined) {
    throw new Error('useFacilityProjectData must be used within a FacilityProjectDataProvider');
  }
  return context;
};

interface FacilityProjectDataProviderProps {
  children: ReactNode;
}

export const FacilityProjectDataProvider: React.FC<FacilityProjectDataProviderProps> = ({ children }) => {
  // Store data by facility ID
  const [facilityDataMap, setFacilityDataMap] = useState<Record<string, FacilityProjectData>>({});

  const getFacilityData = useCallback((facilityId: string): FacilityProjectData | null => {
    return facilityDataMap[facilityId] || null;
  }, [facilityDataMap]);

  const setFacilityData = useCallback((facilityId: string, projects: any[], columns: Column[]) => {
    setFacilityDataMap(prev => ({
      ...prev,
      [facilityId]: {
        projects,
        columns,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  const updateFacilityProjects = useCallback((facilityId: string, projects: any[]) => {
    setFacilityDataMap(prev => {
      const existing = prev[facilityId];
      if (existing) {
        return {
          ...prev,
          [facilityId]: {
            ...existing,
            projects,
            lastUpdated: Date.now()
          }
        };
      }
      return prev;
    });
  }, []);

  const updateFacilityColumns = useCallback((facilityId: string, columns: Column[]) => {
    setFacilityDataMap(prev => {
      const existing = prev[facilityId];
      if (existing) {
        return {
          ...prev,
          [facilityId]: {
            ...existing,
            columns,
            lastUpdated: Date.now()
          }
        };
      }
      return prev;
    });
  }, []);

  const clearFacilityData = useCallback((facilityId: string) => {
    setFacilityDataMap(prev => {
      const newMap = { ...prev };
      delete newMap[facilityId];
      return newMap;
    });
  }, []);

  const clearAllData = useCallback(() => {
    setFacilityDataMap({});
  }, []);

  const value = {
    getFacilityData,
    setFacilityData,
    updateFacilityProjects,
    updateFacilityColumns,
    clearFacilityData,
    clearAllData,
  };

  return (
    <FacilityProjectDataContext.Provider value={value}>
      {children}
    </FacilityProjectDataContext.Provider>
  );
};
