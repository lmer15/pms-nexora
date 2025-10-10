import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FacilityDashboard from '../../../components/analytics/facility/FacilityDashboard';

const FacilityAnalyticsPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  if (!facilityId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Facility Not Found
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            The requested facility could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FacilityDashboard />
      </div>
    </div>
  );
};

export default FacilityAnalyticsPage;
