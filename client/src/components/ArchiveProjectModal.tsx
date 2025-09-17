import React, { useEffect, useState } from 'react';
import { LucideArchive, LucideX } from 'lucide-react';

interface ArchiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  isDarkMode: boolean;
}

const ArchiveConfirmationModal: React.FC<ArchiveConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isDarkMode,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
    } else {
      // Add delay for fade out animation
      const timer = setTimeout(() => setShowModal(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!showModal) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm mx-4 rounded-lg shadow-2xl transition-transform duration-300 ${
          isOpen ? 'scale-100' : 'scale-95'
        } ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <div className="flex items-center space-x-2">
            <LucideArchive className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Archive Project</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Close archive project modal"
          >
            <LucideX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm">
            Are you sure you want to archive <strong>{projectName}</strong>? You can restore it later from the archived projects section.
          </p>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 py-2 border rounded-lg transition-colors text-sm ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveConfirmationModal;
