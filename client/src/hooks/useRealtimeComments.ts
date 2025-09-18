import { useState, useEffect, useRef } from 'react';
import { TaskComment, taskService } from '../api/taskService';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { useAuth } from './useAuth';

export const useRealtimeComments = (taskId: string) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userProfilesCache = useRef<Record<string, { firstName: string; lastName: string; profilePicture?: string }>>({});
  const { user } = useAuth();

  const fetchMissingProfiles = async (comments: TaskComment[], retryCount = 0, setFallbackOnFailure = true): Promise<TaskComment[]> => {
    const missingIds = comments
      .filter(comment => !comment.userProfile && comment.creatorId)
      .map(comment => comment.creatorId)
      .filter((id, index, arr) => arr.indexOf(id) === index && !userProfilesCache.current[id]);

    if (missingIds.length === 0) return comments;

    try {
      const profiles = await taskService.fetchUserProfilesByIds(missingIds);
      userProfilesCache.current = { ...userProfilesCache.current, ...profiles };

      return comments.map(comment => ({
        ...comment,
        userProfile: comment.userProfile ?? userProfilesCache.current[comment.creatorId] ?? { firstName: 'Unknown', lastName: '', profilePicture: undefined }
      }));
    } catch (err) {
      console.error('Failed to fetch user profiles:', err);
      if (retryCount < 2) {
        console.log(`Retrying profile fetch (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return fetchMissingProfiles(comments, retryCount + 1, setFallbackOnFailure);
      }
      if (setFallbackOnFailure) {
        return comments.map(comment => ({
          ...comment,
          userProfile: comment.userProfile ?? { firstName: 'Unknown', lastName: '', profilePicture: undefined }
        }));
      } else {
        return comments;
      }
    }
  };

  useEffect(() => {
    if (!taskId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Preload current user's profile into cache with Firebase data as fallback
    if (user && user.uid && !userProfilesCache.current[user.uid]) {
      const displayName = user.displayName || '';
      const [firstName, ...lastNameParts] = displayName.split(' ');
      userProfilesCache.current[user.uid] = {
        firstName: firstName || 'Unknown',
        lastName: lastNameParts.join(' ') || '',
        profilePicture: user.photoURL || undefined
      };
    }

    // Fetch correct profile for current user from database
    if (user && user.uid) {
      taskService.fetchUserProfilesByIds([user.uid]).then(profiles => {
        userProfilesCache.current = { ...userProfilesCache.current, ...profiles };
      }).catch(err => console.error('Failed to fetch current user profile:', err));
    }

    // Initial fetch
    taskService.getComments(taskId)
      .then(async (data) => {
        const commentsWithProfiles = await fetchMissingProfiles(data);
        setComments(commentsWithProfiles);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch comments:', err);
        setError('Failed to load comments');
        setLoading(false);
      });

    // Set up realtime listener for all taskComments and filter by taskId
    const commentsRef = ref(realtimeDb, 'taskComments');
    const unsubscribe = onValue(commentsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allComments: TaskComment[] = Object.entries(data).map(([id, comment]: [string, any]) => ({ id, ...comment }));
        const filteredComments = allComments.filter((comment: any) => comment.taskId === taskId);
        // Sort comments by createdAt ascending (oldest first)
        filteredComments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Preserve existing userProfiles
        const existingProfiles: Record<string, any> = {};
        comments.forEach(comment => {
          if (comment.userProfile) {
            existingProfiles[comment.id] = comment.userProfile;
          }
        });

        const commentsWithProfiles = await fetchMissingProfiles(filteredComments, 0, false);
        const mergedComments = commentsWithProfiles.map(comment => ({
          ...comment,
          userProfile: existingProfiles[comment.id] || comment.userProfile || { firstName: 'Unknown', lastName: '', profilePicture: undefined }
        }));

        setComments(mergedComments);
      } else {
        setComments([]);
      }
    }, (err) => {
      console.error('Realtime comments error:', err);
      setError('Failed to listen for comments updates');
    });

    // Cleanup listener on unmount or taskId change
    return () => {
      off(commentsRef);
    };
  }, [taskId]);

  return { comments, loading, profilesLoading, error };
};
