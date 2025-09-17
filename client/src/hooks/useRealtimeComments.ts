import { useState, useEffect } from 'react';
import { TaskComment, taskService } from '../api/taskService';

export const useRealtimeComments = (taskId: string) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    taskService.getComments(taskId)
      .then((data) => {
        setComments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch comments:', err);
        setError('Failed to load comments');
        setLoading(false);
      });
  }, [taskId]);

  return { comments, loading, error };
};
