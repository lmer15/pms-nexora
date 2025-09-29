import React, { useState, useEffect } from 'react';
import { LucideX, LucideBuilding, LucideEdit } from 'lucide-react';
import { Facility } from '../api/facilityService';

interface EditFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (facilityId: string, facilityData: { name: string }) => Promise<void>;
  facility: Facility | null;
  isDarkMode: boolean;
}

const EditFacilityModal: React.FC<EditFacilityModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  facility,
  isDarkMode,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (facility && isOpen) {
      setName(facility.name);
    }
  }, [facility, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Facility name is required');
      return;
    }

    if (!facility) {
      setError('No facility selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onUpdate(facility.id, { name: name.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update facility');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setError('');
      onClose();
    }
  };

  if (!isOpen || !facility) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-xl shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <LucideEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Facility</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update facility information</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <LucideX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="facility-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facility Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="facility-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter facility name"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50 transition-colors"
                autoFocus
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Update the name of your facility
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <LucideEdit className="w-4 h-4" />
                  <span>Update Facility</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFacilityModal;
