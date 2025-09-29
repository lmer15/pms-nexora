import React from 'react';
import { LucideX, LucideAlertTriangle, LucideBuilding, LucideTrash2 } from 'lucide-react';
import { Facility } from '../api/facilityService';

interface DeleteFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (facilityId: string) => Promise<void>;
  facility: Facility | null;
  isDarkMode: boolean;
}

const DeleteFacilityModal: React.FC<DeleteFacilityModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  facility,
  isDarkMode,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleDelete = async () => {
    if (!facility) return;

    try {
      setLoading(true);
      setError('');
      await onDelete(facility.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete facility');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  if (!isOpen || !facility) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-xl shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
              <LucideAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Facility</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone</p>
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

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
              <LucideBuilding className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete "{facility.name}"?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This action cannot be undone. All projects, tasks, and data associated with this facility will be permanently deleted.
              </p>
              
              {/* Facility Stats */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">This facility contains:</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{facility.memberCount || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{facility.projectCount || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Projects</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{facility.taskCount || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tasks</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center">
                  <LucideAlertTriangle className="w-4 h-4 mr-2" />
                  All of this data will be permanently lost!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <LucideTrash2 className="w-4 h-4" />
                <span>Delete Facility</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteFacilityModal;
