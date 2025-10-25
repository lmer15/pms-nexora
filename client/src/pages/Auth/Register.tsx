import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import PasswordSetupModal from '../../components/PasswordSetupModal';

export default function Register() {
  const { register, googleLogin, setPasswordForGoogleUser } = useAuth();

  // Registration state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, firstName, lastName);
      setSuccess(true);
      // User will be redirected to login after email verification
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google registration/login
  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const response = await googleLogin(idToken);
      
      // Check if user needs to set password
      if (response?.needsPasswordSetup) {
        setGoogleUser(response.user);
        setShowPasswordModal(true);
      }
      // If user doesn't need password setup, App.tsx will handle navigation
    } catch (err: any) {
      console.error('Google auth error:', err);
      let errorMessage = 'Google sign-in failed. Please try again.';

      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser. Please allow popups and try again.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (err.message && err.message.includes('Cross-Origin-Opener-Policy')) {
        errorMessage = 'Authentication completed successfully. Redirecting...';
        return;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  // Handle password setup for Google users
  const handlePasswordSetup = async (password: string) => {
    try {
      await setPasswordForGoogleUser(password);
      setShowPasswordModal(false);
      setGoogleUser(null);
    } catch (err: any) {
      console.error('Password setup error:', err);
      setError(err.message || 'Failed to set password');
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to <strong>{email}</strong>. Please check your email and click the link to verify your account.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            After verification, you can log in to your account.
          </p>
          <Link
            to="/login"
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* First Name */}
            <div className="relative mb-4">
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:border-green-500 focus:outline-none"
              />
              <label
                htmlFor="firstName"
                className={`absolute left-3 px-1 text-sm transition-all
                  ${firstName ? "-top-2 bg-white text-green-500" : "top-4 text-gray-400"}
                  peer-focus:-top-2 peer-focus:bg-white peer-focus:text-green-500`}
              >
                First Name
              </label>
            </div>

            {/* Last Name */}
            <div className="relative mb-4">
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:border-green-500 focus:outline-none"
              />
              <label
                htmlFor="lastName"
                className={`absolute left-3 px-1 text-sm transition-all
                  ${lastName ? "-top-2 bg-white text-green-500" : "top-4 text-gray-400"}
                  peer-focus:-top-2 peer-focus:bg-white peer-focus:text-green-500`}
              >
                Last Name
              </label>
            </div>

            {/* Email */}
            <div className="relative mb-4">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:border-green-500 focus:outline-none"
              />
              <label
                htmlFor="email"
                className={`absolute left-3 px-1 text-sm transition-all
                  ${email ? "-top-2 bg-white text-green-500" : "top-4 text-gray-400"}
                  peer-focus:-top-2 peer-focus:bg-white peer-focus:text-green-500`}
              >
                Email
              </label>
            </div>

            {/* Password */}
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:border-green-500 focus:outline-none pr-10"
              />
              <label
                htmlFor="password"
                className={`absolute left-3 px-1 text-sm transition-all
                  ${password ? "-top-2 bg-white text-green-500" : "top-4 text-gray-400"}
                  peer-focus:-top-2 peer-focus:bg-white peer-focus:text-green-500`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {!showPassword && (
                  <span className="absolute top-1/2 left-1/2 w-full h-px bg-gray-500 rotate-45 -translate-x-1/2 -translate-y-1/2"></span>
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative mb-6">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 focus:border-green-500 focus:outline-none pr-10"
              />
              <label
                htmlFor="confirmPassword"
                className={`absolute left-3 px-1 text-sm transition-all
                  ${confirmPassword ? "-top-2 bg-white text-green-500" : "top-4 text-gray-400"}
                  peer-focus:-top-2 peer-focus:bg-white peer-focus:text-green-500`}
              >
                Confirm Password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {!showConfirmPassword && (
                  <span className="absolute top-1/2 left-1/2 w-full h-px bg-gray-500 rotate-45 -translate-x-1/2 -translate-y-1/2"></span>
                )}
              </button>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition mb-6 disabled:bg-green-400"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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
            onClick={handleGoogleAuth}
            className="w-full border border-gray-300 py-2 rounded-md hover:bg-gray-100 flex items-center justify-center mb-6"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Continue with Google
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Password Setup Modal for Google Users */}
      <PasswordSetupModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setGoogleUser(null);
        }}
        onPasswordSet={handlePasswordSetup}
        isDarkMode={false}
      />
    </div>
  );
}
