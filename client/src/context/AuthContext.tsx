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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        setToken(idToken);
        // Sync user with backend
        try {
          await authService.syncUser(idToken);
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
        }
      } else {
        setToken(null);
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
      setToken(idToken);
      
      // Verify with backend
      await authService.verifyToken(idToken);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('Account not found. Please sign up with Google.');
      }
      throw error;
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
    await authService.registerUser(idToken, firstName, lastName);
  };

  const googleLogin = async (idToken: string) => {
    try {
      // Verify with backend and get JWT
      const response = await authService.googleAuth(idToken);
      setToken(response.token);

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