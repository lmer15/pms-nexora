import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LucideBuilding,
  LucideUsers,
  LucideClipboardList,
  LucideSettings,
  LucideSearch,
  LucideFilter,
  LucidePlus,
  LucideEdit,
  LucideTrash2,
  LucideEye,
} from 'lucide-react';
import { facilityService, Facility } from '../api/facilityService';
import CreateFacilityModal from '../components/CreateFacilityModal';
import EditFacilityModal from '../components/EditFacilityModal';
import DeleteFacilityModal from '../components/DeleteFacilityModal';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  archived: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
};

const Facilities: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
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

  const handleCreateFacility = async (facilityData: { name: string }) => {
    try {
      console.log('Creating facility with data:', facilityData);
      const newFacility = await facilityService.create(facilityData);
      setFacilities(prev => [...prev, newFacility]);
    } catch (error) {
      console.error('Error creating facility:', error);
      throw error;
    }
  };

  const handleEditFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsEditModalOpen(true);
  };

  const handleDeleteFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateFacility = async (facilityId: string, facilityData: { name: string }) => {
    try {
      const updatedFacility = await facilityService.update(facilityId, facilityData);
      setFacilities(prev => prev.map(f => f.id === facilityId ? updatedFacility : f));
    } catch (error) {
      throw error;
    }
  };

  const handleStatusChange = async (facilityId: string, newStatus: 'active' | 'inactive' | 'archived') => {
    try {
      const updatedFacility = await facilityService.updateStatus(facilityId, newStatus);
      setFacilities(prev => prev.map(f => f.id === facilityId ? updatedFacility : f));
    } catch (error) {
      console.error('Failed to update facility status:', error);
    }
  };

  const handleStartEditName = (facility: Facility) => {
    setEditingFacilityId(facility.id);
    setEditingName(facility.name);
  };

  const handleSaveName = async (facilityId: string) => {
    if (!editingName.trim()) return;
    
    try {
      const updatedFacility = await facilityService.update(facilityId, { name: editingName.trim() });
      setFacilities(prev => prev.map(f => f.id === facilityId ? updatedFacility : f));
      setEditingFacilityId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to update facility name:', error);
    }
  };

  const handleCancelEditName = () => {
    setEditingFacilityId(null);
    setEditingName('');
  };

  const handleDeleteFacilityConfirm = async (facilityId: string) => {
    try {
      await facilityService.delete(facilityId);
      setFacilities(prev => prev.filter(f => f.id !== facilityId));
    } catch (error) {
      throw error;
    }
  };

  // Filter facilities based on search term and filter criteria
  const filteredFacilities = React.useMemo(() => {
    if (!searchTerm && filter === 'all') {
      return facilities;
    }

    return facilities.filter(facility => {
      // Filter by facility name and description
      const nameMatches = !searchTerm || 
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (facility.description && facility.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by facility characteristics
      let statusMatches = true;
      if (filter !== 'all') {
        switch (filter) {
          case 'active':
            statusMatches = facility.status === 'active';
            break;
          case 'inactive':
            statusMatches = facility.status === 'inactive';
            break;
          case 'archived':
            statusMatches = facility.status === 'archived';
            break;
          case 'with-members':
            statusMatches = (facility.memberCount || 0) > 0;
            break;
          case 'with-projects':
            statusMatches = (facility.projectCount || 0) > 0;
            break;
          case 'empty':
            statusMatches = (facility.memberCount || 0) === 0 && (facility.projectCount || 0) === 0;
            break;
          default:
            statusMatches = true;
        }
      }

      return nameMatches && statusMatches;
    });
  }, [facilities, searchTerm, filter]);

  // Calculate total statistics
  const totalStats = React.useMemo(() => {
    return facilities.reduce((acc, facility) => ({
      totalMembers: acc.totalMembers + (facility.memberCount || 0),
      totalProjects: acc.totalProjects + (facility.projectCount || 0),
      totalTasks: acc.totalTasks + (facility.taskCount || 0),
    }), { totalMembers: 0, totalProjects: 0, totalTasks: 0 });
  }, [facilities]);

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
            <p className="text-lg font-bold text-gray-900 dark:text-white">{totalStats.totalMembers}</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand-dark/10">
            <LucideClipboardList className="w-4 h-4 text-brand-dark" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Projects</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{totalStats.totalProjects}</p>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Facilities
            {filteredFacilities.length !== facilities.length && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({filteredFacilities.length} of {facilities.length})
              </span>
            )}
          </h3>
          
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative">
              <LucideSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <LucideFilter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                title="Filter facilities"
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Facilities</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
                <option value="with-members">With Members</option>
                <option value="with-projects">With Projects</option>
                <option value="empty">Empty</option>
              </select>
            </div>

            {/* Create Facility Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors text-sm"
            >
              <LucidePlus className="w-4 h-4" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {filteredFacilities.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <LucideBuilding className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-xs">
              {facilities.length === 0 
                ? "No facilities found. Create your first facility to get started."
                : "No facilities match your search criteria."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Members</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Projects</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Tasks</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacilities.map((facility) => (
                  <tr key={facility.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 text-xs text-gray-900 dark:text-white font-medium">
                      {editingFacilityId === facility.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveName(facility.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEditName();
                              }
                            }}
                            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveName(facility.id)}
                            className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEditName}
                            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditName(facility)}
                          className="text-left hover:bg-gray-100 dark:hover:bg-gray-700 px-1 py-0.5 rounded transition-colors"
                        >
                          {facility.name}
                        </button>
                      )}
                    </td>
                    <td className="py-3 text-xs text-gray-600 dark:text-gray-400">{facility.memberCount || 0}</td>
                    <td className="py-3 text-xs text-gray-600 dark:text-gray-400">{facility.projectCount || 0}</td>
                    <td className="py-3 text-xs text-gray-600 dark:text-gray-400">{facility.taskCount || 0}</td>
                    <td className="py-3">
                      <select
                        value={facility.status || 'active'}
                        onChange={(e) => handleStatusChange(facility.id, e.target.value as 'active' | 'inactive' | 'archived')}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-brand ${statusColors[facility.status || 'active']}`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(facility.id)}
                          className="p-1 text-brand hover:text-brand-dark transition-colors"
                          title="View Details"
                        >
                          <LucideEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFacility(facility)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                          title="Delete Facility"
                        >
                          <LucideTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Facility Modal */}
      <CreateFacilityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateFacility}
        isDarkMode={isDarkMode}
      />

      {/* Edit Facility Modal */}
      <EditFacilityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedFacility(null);
        }}
        onUpdate={handleUpdateFacility}
        facility={selectedFacility}
        isDarkMode={isDarkMode}
      />

      {/* Delete Facility Modal */}
      <DeleteFacilityModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedFacility(null);
        }}
        onDelete={handleDeleteFacilityConfirm}
        facility={selectedFacility}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default Facilities;
