import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { authService } from '../api/authService';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import { storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  databaseUser: any | null; // Database user information
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<{ needsPasswordSetup: boolean; user: any } | void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  setPasswordForGoogleUser: (password: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  loading: boolean;
  needsPasswordSetup: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [databaseUser, setDatabaseUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        // Skip processing during registration to prevent dashboard flash
        if (isRegistering) {
          setLoading(false);
          return;
        }

        try {
          const idToken = await user.getIdToken();
          // Sync user with backend
          const response = await authService.syncUser(idToken);
          setToken(response.token);
          setDatabaseUser(response.user); // Store database user information
          storage.setToken(response.token);
          
          const userProfileUpdatedEvent = new CustomEvent('userProfileUpdated', {
            detail: { userId: user.uid, user: response.user }
          });
          window.dispatchEvent(userProfileUpdatedEvent);
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
          // Continue with Firebase authentication despite sync failure
          setToken(null);
          setDatabaseUser(null);
          storage.removeToken();
        }
      } else {
        setToken(null);
        setDatabaseUser(null);
        storage.removeToken();
      }
      setLoading(false);
    });

    // Listen for profile updates from other components
    const handleUserProfileUpdate = (event: any) => {
      const { user: updatedUser } = event.detail;
      if (updatedUser && updatedUser.uid === auth.currentUser?.uid) {
        setUser(updatedUser);
      }
    };

    window.addEventListener('userProfileUpdated', handleUserProfileUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdate);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        throw new Error('Please verify your email before logging in.');
      }

      const idToken = await userCredential.user.getIdToken();

      // Verify with backend
      const response = await authService.verifyToken(idToken);
      setToken(response.token);
      setDatabaseUser(response.user); // Store database user information
      // Store token in localStorage for API interceptor
      storage.setToken(response.token);
    } catch (error: any) {
      // Handle specific cases first
      if (error.code === 'auth/user-not-found') {
        throw new Error('Account not found. Please sign up with Google.');
      }
      // Use the utility for user-friendly Firebase error messages
      const friendlyMessage = getFirebaseErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    // Set registration flag to prevent dashboard flash
    setIsRegistering(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });

    // Send verification email with custom action code settings
    await sendEmailVerification(userCredential.user, {
      url: `${window.location.origin}/email-verification`
    });

      // Register user in backend
      const idToken = await userCredential.user.getIdToken();
      const response = await authService.registerUser(idToken, firstName, lastName);
      
      // Sign out user after registration to require email verification
      await firebaseSignOut(auth);
      setToken(null);
      storage.clearAuthData();
    } finally {
      // Clear registration flag after sign out
      setIsRegistering(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      // Verify with backend and get JWT
      const response = await authService.googleAuth(idToken);
      
      // Check if user needs to set password
      if (response.needsPasswordSetup) {
        // Store temporary token for password setup
      setToken(response.token);
      setDatabaseUser(response.user); // Store database user information
      storage.setToken(response.token);
      setNeedsPasswordSetup(true);
      return { needsPasswordSetup: true, user: response.user };
      }
      
      setToken(response.token);
      setDatabaseUser(response.user); // Store database user information
      // Store token in localStorage for API interceptor
      storage.setToken(response.token);

      // Don't navigate here - let the component handle navigation
      return { needsPasswordSetup: false, user: response.user };
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in');
    await sendEmailVerification(user, {
      url: `${window.location.origin}/email-verification`
    });
  };

  const setPasswordForGoogleUser = async (password: string) => {
    try {
      await authService.setPasswordForGoogleUser(password);
      setNeedsPasswordSetup(false);
      // Navigate to dashboard after password setup
      navigate('/resources/analytics/global', { replace: true });
    } catch (error) {
      console.error('Failed to set password:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    try {
      if (user) {
        // First get the updated database user profile
        const idToken = await user.getIdToken();
        const response = await authService.verifyToken(idToken);
        setDatabaseUser(response.user);
        setToken(response.token);
        storage.setToken(response.token);

        // Update Firebase user's displayName and photoURL to match database
        const updateData: { displayName?: string; photoURL?: string } = {};
        if (response.user.firstName && response.user.lastName) {
          const fullName = `${response.user.firstName} ${response.user.lastName}`;
          updateData.displayName = fullName;
        }
        if (response.user.profilePicture) {
          updateData.photoURL = response.user.profilePicture;
        }
        
        if (Object.keys(updateData).length > 0) {
          await updateProfile(user, updateData);
          
          // Reload Firebase user to get updated profile
          await user.reload();
          const updatedUser = auth.currentUser;
          if (updatedUser) {
            setUser(updatedUser);
          }
        }

        // Dispatch custom event to notify other components of profile update
        const userProfileUpdatedEvent = new CustomEvent('userProfileUpdated', {
          detail: { userId: user.uid, user: response.user }
        });
        window.dispatchEvent(userProfileUpdatedEvent);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      // Don't throw error to avoid breaking the UI
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setToken(null);
    setDatabaseUser(null);
    storage.clearAuthData();
  };

  const value = {
    user,
    token,
    databaseUser,
    login,
    register,
    googleLogin,
    logout,
    sendVerificationEmail,
    setPasswordForGoogleUser,
    refreshUserProfile,
    loading,
    needsPasswordSetup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};