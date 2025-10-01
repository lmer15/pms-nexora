import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CurrentFacilityContextType {
  currentFacilityName: string | null;
  setCurrentFacilityName: (name: string | null) => void;
}

const CurrentFacilityContext = createContext<CurrentFacilityContextType | undefined>(undefined);

export const useCurrentFacility = () => {
  const context = useContext(CurrentFacilityContext);
  if (context === undefined) {
    throw new Error('useCurrentFacility must be used within a CurrentFacilityProvider');
  }
  return context;
};

interface CurrentFacilityProviderProps {
  children: ReactNode;
}

export const CurrentFacilityProvider: React.FC<CurrentFacilityProviderProps> = ({ children }) => {
  const [currentFacilityName, setCurrentFacilityName] = useState<string | null>(null);

  return (
    <CurrentFacilityContext.Provider value={{ currentFacilityName, setCurrentFacilityName }}>
      {children}
    </CurrentFacilityContext.Provider>
  );
};
