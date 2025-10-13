import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import AccountLinkingPrompt from '../../components/AccountLinkingPrompt';
import { accountLinkingService } from '../../api/accountLinkingService';

export default function Login() {
  const { login, googleLogin, sendVerificationEmail } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Account linking state
  const [showLinkingPrompt, setShowLinkingPrompt] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState('');
  const [existingMethod, setExistingMethod] = useState<'google' | 'email_password'>('google');

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      // Check if this might be a Google account that needs linking
      if (err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.message === 'Account not found. Please sign up with Google.' ||
          err.message === 'Invalid credentials provided.') {
        
        // First check if account is already linked
        try {
          const accountInfo = await accountLinkingService.checkAccountType(loginEmail);
          
          // Show linking prompt if account exists but is missing one method
          if (accountInfo.exists && accountInfo.authMethods.length === 1) {
            setLinkingEmail(loginEmail);
            // Determine which method is missing
            if (!accountInfo.authMethods.includes('email_password')) {
              setExistingMethod('google'); // User has Google, needs email/password
            } else {
              setExistingMethod('email_password'); // User has email/password, needs Google
            }
            setShowLinkingPrompt(true);
            setLoginError('');
            return;
          } else {
            // Account is already linked or doesn't exist, show normal error
            setLoginError(err.message);
          }
        } catch (checkError) {
          setLoginError(err.message);
        }
      } else {
        setLoginError(err.message);
      }
    } finally {
      setLoginLoading(false);
    }
  };



  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Configure provider settings
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await googleLogin(idToken);
    } catch (err: any) {
      console.error('Google login error:', err);

      // Handle specific error types
      let errorMessage = 'Google sign-in failed. Please try again.';

      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser. Please allow popups and try again.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (err.message && err.message.includes('Cross-Origin-Opener-Policy')) {
        errorMessage = 'Authentication completed successfully. Redirecting...';
        // Don't show error for COOP issues as auth might still succeed
        return;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setLoginError(errorMessage);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  // Handle account linking
  const handleLinkAccount = async (password: string) => {
    try {
      if (existingMethod === 'google') {
        // Linking email/password to Google account
        let currentUser = auth.currentUser;
        let idToken = '';

        if (currentUser && currentUser.email === loginEmail) {
          // User is already signed in with the correct email
          idToken = await currentUser.getIdToken();
        } else {
          // User needs to sign in with Google
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({
            prompt: 'select_account'
          });

          const result = await signInWithPopup(auth, provider);
          idToken = await result.user.getIdToken();

          // Verify the Google account email matches the email they're trying to link
          if (result.user.email !== loginEmail) {
            throw new Error('Google account email does not match the email you entered');
          }
        }

        // Use the password they already entered in the login form
        const passwordToUse = password || loginPassword;

        // Link the email/password to the Google account
        const response = await accountLinkingService.linkEmailPassword(idToken, passwordToUse);
        
        if (response.success) {
          setShowLinkingPrompt(false);
          setLoginError('✅ Account linked successfully! You can now login with email/password.');
          
          setTimeout(() => {
            if (auth.currentUser) {
              window.location.href = '/resources/analytics/global';
            } else {
              setLoginError('✅ Account linked successfully! Please login with your email/password.');
            }
          }, 2000);
        } else {
          throw new Error(response.message || 'Failed to link account');
        }
      } else {
        // Linking Google to email/password account
        // First authenticate with email/password to get the account
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        const idToken = await userCredential.user.getIdToken();

        // Then authenticate with Google
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        const googleResult = await signInWithPopup(auth, provider);
        const googleIdToken = await googleResult.user.getIdToken();

        // Verify the Google account email matches
        if (googleResult.user.email !== loginEmail) {
          throw new Error('Google account email does not match the email you entered');
        }

        // Link Google to the email/password account
        const response = await accountLinkingService.linkGoogleAccount(idToken, googleIdToken);
        
        if (response.success) {
          setShowLinkingPrompt(false);
          setLoginError('✅ Account linked successfully! You can now login with Google.');
          
          setTimeout(() => {
            if (auth.currentUser) {
              window.location.href = '/resources/analytics/global';
            } else {
              setLoginError('✅ Account linked successfully! Please login with your preferred method.');
            }
          }, 2000);
        } else {
          throw new Error(response.message || 'Failed to link account');
        }
      }
    } catch (err: any) {
      console.error('Account linking error:', err);
      try {
        await auth.signOut();
      } catch (signOutError) {
        // Silent error handling
      }
      throw new Error(err.message || 'Failed to link account');
    }
  };

  // Handle using existing method
  const handleUseExistingMethod = () => {
    setShowLinkingPrompt(false);
    if (existingMethod === 'google') {
      handleGoogleLogin();
    }
  };

  // Handle cancel linking
  const handleCancelLinking = () => {
    setShowLinkingPrompt(false);
    setLinkingEmail('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Left Image */}
      <img
        src="/images/right.png"
        alt="Left Background"
        className="absolute bottom-0 left-0 w-50 h-50 object-cover"
      />

      {/* Right Image */}
      <img
        src="/images/left.png"
        alt="Right Background"
        className="absolute bottom-0 right-0 w-50 h-50 object-cover"
      />
      <div className="w-full max-w-4xl flex bg-white shadow-xl rounded-lg overflow-hidden relative">

      {/* Left Side */}
      <div className="hidden md:flex md:w-1/2 flex-col text-white items-center justify-between p-10 relative">
          <div className="flex items-center justify-start w-full mb-6">
            <img src="/images/nexora.png" alt="Logo" className="h-9 w-9 mr-2" />
            <h2 className="text-2xl font-black text-green-700">Nexora</h2>
          </div>
        <img src="/images/icon.png" alt="Nexora" className="h-100 w-100 mt-auto mb-auto" />
        <p className="text-sm text-gray-400 mt-2">Copyright © 2025 Nexora Reserve</p>
      </div>

        {/* Vertical Line */}
        <div className="hidden md:block absolute top-10 bottom-10 left-1/2 w-px bg-gray-300"></div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center z-10">
          <h2 className="text-3xl font-bold text-center mb-6">Log In</h2>
          

          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {loginError}
            </div>
          )}

          {/* Email verification prompt */}
          {loginError === 'Please verify your email before logging in.' && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p>Please verify your email address.</p>
              {!verificationSent ? (
                <button
                  onClick={handleResendVerification}
                  className="text-green-600 hover:underline mt-2"
                >
                  Resend verification email
                </button>
              ) : (
                <p className="text-green-600 mt-2">Verification email sent!</p>
              )}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="relative mb-6">
              <input
                type="email"
                id="loginEmail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:border-green-500 focus:outline-none"
              />
              <label
                htmlFor="loginEmail"
                className={`absolute left-3 px-1 text-sm transition-all
                  ${loginEmail ? "-top-2 bg-white text-green-500" : "top-4 text-gray-400"}
                  peer-focus:-top-2 peer-focus:bg-white peer-focus:text-green-500`}
              >
                Email
              </label>
            </div>

            {/* Password */}
            <div className="relative mb-4">
              <input
                type={loginShowPassword ? "text" : "password"}
                id="loginPassword"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:border-green-500 focus:outline-none pr-10"
              />
              <label
                htmlFor="loginPassword"
                className={`absolute left-3 px-1 text-sm transition-all
                  ${loginPassword ? "-top-2 bg-white text-green-500" : "top-4 text-gray-400"}
                  peer-focus:-top-2 peer-focus:bg-white peer-focus:text-green-500`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setLoginShowPassword(!loginShowPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-500"
              >
                {/* Eye SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {!loginShowPassword && (
                  <span className="absolute top-1/2 left-1/2 w-full h-px bg-gray-500 rotate-45 -translate-x-1/2 -translate-y-1/2"></span>
                )}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end mb-4">
              <a href="#" className="text-green-600 hover:underline text-sm">
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition mb-6 disabled:bg-green-400"
            >
              {loginLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Divider with OR */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 py-2 rounded-md hover:bg-gray-100 flex items-center justify-center mb-6"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Continue with Google
          </button>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-600 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Account Linking Prompt */}
      {showLinkingPrompt && (
        <AccountLinkingPrompt
          email={linkingEmail}
          existingMethod={existingMethod}
          onLinkAccount={handleLinkAccount}
          onUseExistingMethod={handleUseExistingMethod}
          onCancel={handleCancelLinking}
        />
      )}
    </div>
  );
}