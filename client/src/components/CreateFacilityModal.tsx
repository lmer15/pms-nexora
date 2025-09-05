import React, { useState } from 'react';
import { LucideX, LucidePlus } from 'lucide-react';
import { facilityService, Facility } from '../api/facilityService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface CreateFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFacilityCreated: (facility: Facility) => void;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
}

const CreateFacilityModal: React.FC<CreateFacilityModalProps> = ({
  isOpen,
  onClose,
  onFacilityCreated,
  isDarkMode,
  isSidebarCollapsed,
}) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newFacility = await facilityService.create({
        name: formData.name.trim(),
      });

      onFacilityCreated(newFacility);
      setFormData({ name: '' });
      navigate(`/facility/${newFacility.id}`);
      onClose();
    } catch (err) {
      setError('Failed to create facility. Please try again.');
      console.error('Error creating facility:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300">
      <div
        className={`absolute rounded-lg shadow-xl transform transition-transform duration-300 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        } ${isSidebarCollapsed ? 'w-full max-w-sm top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : 'w-80 top-16 left-72'}`}
      >
        {/* Header */}
        <div
          className={`px-4 py-2 border-b flex items-center justify-between ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold">Create New Facility</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <LucideX className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2 text-xs bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-xs font-medium mb-1">
              Facility Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-brand ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter facility name"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 py-1.5 text-xs border rounded-md transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 text-xs bg-brand text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFacilityModal;
