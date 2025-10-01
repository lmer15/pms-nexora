import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FacilityRefreshContextType {
  refreshTrigger: number;
  triggerFacilityRefresh: () => void;
  triggerMemberRefresh: (facilityId: string) => void;
  memberRefreshTriggers: Record<string, number>;
}

const FacilityRefreshContext = createContext<FacilityRefreshContextType | undefined>(undefined);

export const useFacilityRefresh = () => {
  const context = useContext(FacilityRefreshContext);
  if (context === undefined) {
    throw new Error('useFacilityRefresh must be used within a FacilityRefreshProvider');
  }
  return context;
};

interface FacilityRefreshProviderProps {
  children: ReactNode;
}

export const FacilityRefreshProvider: React.FC<FacilityRefreshProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [memberRefreshTriggers, setMemberRefreshTriggers] = useState<Record<string, number>>({});

  const triggerFacilityRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const triggerMemberRefresh = useCallback((facilityId: string) => {
    setMemberRefreshTriggers(prev => ({
      ...prev,
      [facilityId]: (prev[facilityId] || 0) + 1
    }));
    // Also trigger general facility refresh
    triggerFacilityRefresh();
  }, [triggerFacilityRefresh]);

  const value = {
    refreshTrigger,
    triggerFacilityRefresh,
    triggerMemberRefresh,
    memberRefreshTriggers,
  };

  return (
    <FacilityRefreshContext.Provider value={value}>
      {children}
    </FacilityRefreshContext.Provider>
  );
};
