import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { applyActionCode } from 'firebase/auth';

export default function EmailVerification() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the action code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const actionCode = urlParams.get('oobCode');
        const mode = urlParams.get('mode');

        if (mode === 'verifyEmail' && actionCode) {
          // Apply the email verification
          await applyActionCode(auth, actionCode);
          setSuccess(true);
        } else {
          setError('Invalid verification link');
        }
      } catch (err: any) {
        console.error('Email verification error:', err);
        setError(err.message || 'Failed to verify email');
      } finally {
        setLoading(false);
      }
    };

    handleEmailVerification();
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email...</h2>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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

  if (success) {
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
        
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8 text-center relative z-10">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your email has been verified. You can now sign in with your new account.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition inline-block"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/"
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition inline-block"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
