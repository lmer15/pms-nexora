import React, { useState, useEffect } from 'react';
import { taskService, TaskDetails } from '../api/taskService';

interface LazyTaskDetailsProps {
  taskId: string;
  children: (details: TaskDetails | null, loading: boolean, error: string | null) => React.ReactNode;
}

export const LazyTaskDetails: React.FC<LazyTaskDetailsProps> = ({ taskId, children }) => {
  const [details, setDetails] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async () => {
    if (details) return; // Already loaded
    
    setLoading(true);
    setError(null);
    
    try {
      const taskDetails = await taskService.getTaskDetails(taskId);
      setDetails(taskDetails);
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children(details, loading, error)}
      {!details && !loading && (
        <button
          onClick={loadDetails}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Load Full Details
        </button>
      )}
    </>
  );
};

export default LazyTaskDetails;
