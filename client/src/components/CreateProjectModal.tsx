import React, { useState } from 'react';
import { LucideX, LucidePlus } from 'lucide-react';
import { projectService, Project } from '../api/projectService';
import { useAuth } from '../context/AuthContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  facilityId: string;
  isDarkMode: boolean;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  facilityId,
  isDarkMode,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newProject = await projectService.create({
        name: formData.name.trim(),
        facilityId,
        creatorId: user?.uid || 'current-user-id', // Use authenticated user ID
        assignees: [user?.uid || 'current-user-id'], // Use authenticated user ID
        status: 'planning',
      });

      onProjectCreated(newProject);
      setFormData({ name: '' });
      onClose();
    } catch (err) {
      setError('Failed to create project. Please try again.');
      console.error('Error creating project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className={`w-full max-w-lg mx-4 rounded-lg shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`px-6 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <div className="flex items-center space-x-3">
            <LucidePlus className="w-6 h-6 text-brand" />
            <h2 className="text-xl font-semibold">Create New Project</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <LucideX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-base font-medium mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand focus:border-brand ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-400 text-gray-900 placeholder-gray-500'}`}
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
