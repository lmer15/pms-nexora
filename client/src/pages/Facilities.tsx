import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LucideBuilding,
  LucideUsers,
  LucideClipboardList,
  LucideSettings,
} from 'lucide-react';
import { facilityService, Facility } from '../api/facilityService';

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const Facilities: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const data = await facilityService.getAll();
      setFacilities(data);
    } catch (err) {
      setError('Failed to load facilities');
      console.error('Error loading facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (facilityId: string) => {
    navigate(`/facility/${facilityId}`);
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs">{error}</p>
          <button
            onClick={loadFacilities}
            className="px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-xs"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand/10">
            <LucideBuilding className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Facilities</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{facilities.length}</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand-light/10">
            <LucideUsers className="w-4 h-4 text-brand-light" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Members</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">0</p> {/* TODO: Calculate from API */}
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand-dark/10">
            <LucideClipboardList className="w-4 h-4 text-brand-dark" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Active Projects</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">0</p> {/* TODO: Calculate from API */}
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-green-100">
            <LucideSettings className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Active Facilities</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{facilities.length}</p>
          </div>
        </div>
      </div>

      {/* Facilities List */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Facilities</h3>

        {facilities.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <LucideBuilding className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-xs">No facilities found. Create your first facility to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Location</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Members</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Projects</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((facility) => (
                  <tr key={facility.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 text-xs text-gray-900 dark:text-white">{facility.name}</td>
                    <td className="py-3 text-xs text-gray-600 dark:text-gray-400">{/* location removed */}</td>
                    <td className="py-3 text-xs text-gray-600 dark:text-gray-400">0</td> {/* TODO: Fetch member count */}
                    <td className="py-3 text-xs text-gray-600 dark:text-gray-400">0</td> {/* TODO: Fetch project count */}
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors['Active']}`}>
                        Active
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleViewDetails(facility.id)}
                        className="text-brand hover:text-brand-dark text-xs transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Facilities;
