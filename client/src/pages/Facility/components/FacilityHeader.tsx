import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LucideBuilding,
  LucideUsers,
  LucideClipboardList,
  LucideArrowLeft,
  LucideSearch,
  LucideFilter,
  LucideShare2,
} from 'lucide-react';
import { Facility } from '../types';
import ShareBoardModal from './ShareFacilityModal';

interface FacilityHeaderProps {
  facility: Facility;
  projectsCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  isDarkMode: boolean;
}

const FacilityHeader: React.FC<FacilityHeaderProps> = ({
  facility,
  projectsCount,
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  isDarkMode,
}) => {
  const navigate = useNavigate();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Dummy members data for modal
  const members = [
    { id: 'you', name: 'Elmer Rapon', username: 'elmerrapon', role: 'Admin', avatarColor: '#f87171' },
    { id: 'bd', name: 'Benjie Degamo', username: 'benjiedegamo', role: 'Admin', avatarColor: '#60a5fa' },
    { id: 'ja', name: 'Jhonmark Almedilla', username: 'jhonmarkalmedilla', role: 'Admin', avatarColor: '#a78bfa' },
    { id: 'pj', name: 'panilag jen', username: 'panilagjen', role: 'Admin', avatarColor: '#34d399' },
    { id: 'rv', name: 'Rohanna Villagracia', username: 'rohannavillagracia', role: 'Admin', avatarColor: '#818cf8' },
    { id: 'ct', name: 'Christine Toñacao', username: 'christinetonacao', role: 'Guest', avatarColor: '#c084fc' },
  ];

  return (
    <div className={`p-3 border-b rounded-md ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/Facilities')}
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <LucideArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {facility.name}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <LucideBuilding className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Facility ID: {facility.id.slice(-8)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <LucideUsers className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">12 Members</span>
              </div>
              <div className="flex items-center space-x-1">
                <LucideClipboardList className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{projectsCount} Projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Controls - Moved to right side */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <LucideSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
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
              title="Filter projects"
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            title="Share Facility"
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <LucideShare2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {facility.description && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{facility.description}</p>
        </div>
      )}

      {/* Share Modal */}
      <ShareBoardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        members={members}
      />
    </div>
  );
};

export default FacilityHeader;
