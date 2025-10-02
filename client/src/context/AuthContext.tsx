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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const idToken = await user.getIdToken();
        // Sync user with backend
        try {
          const response = await authService.syncUser(idToken);
          setToken(response.token);
          // Store token in localStorage for API interceptor
          storage.setToken(response.token);
          
          // Dispatch custom event to trigger user profile refresh
          const userProfileUpdatedEvent = new CustomEvent('userProfileUpdated', {
            detail: { userId: user.uid, user: response.user }
          });
          window.dispatchEvent(userProfileUpdatedEvent);
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
          // If sync fails, logout to prevent loop
          await firebaseSignOut(auth);
          setToken(null);
          storage.removeToken();
        }
      } else {
        setToken(null);
        storage.removeToken();
      }
      setLoading(false);
    });

    return unsubscribe;
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with name
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`
    });

    // Send verification email
    await sendEmailVerification(userCredential.user);

    // Register user in backend
    const idToken = await userCredential.user.getIdToken();
    const response = await authService.registerUser(idToken, firstName, lastName);
    setToken(response.token);
    // Store token in localStorage for API interceptor
    storage.setToken(response.token);
  };

  const googleLogin = async (idToken: string) => {
    try {
      // Verify with backend and get JWT
      const response = await authService.googleAuth(idToken);
      setToken(response.token);
      // Store token in localStorage for API interceptor
      storage.setToken(response.token);

      // Navigate to dashboard after successful authentication
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in');
    await sendEmailVerification(user);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setToken(null);
    storage.clearAuthData();
  };

  const value = {
    user,
    token,
    login,
    register,
    googleLogin,
    logout,
    sendVerificationEmail,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};