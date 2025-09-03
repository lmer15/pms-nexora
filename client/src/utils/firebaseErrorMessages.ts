/**
 * Maps Firebase authentication error codes to user-friendly error messages
 * @param error - The error object from Firebase
 * @returns A user-friendly error message string
 */
export function getFirebaseErrorMessage(error: any): string {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Map common Firebase Auth error codes to user-friendly messages
  const errorMap: { [key: string]: string } = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
    'auth/invalid-credential': 'Invalid credentials provided.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/invalid-verification-id': 'Invalid verification ID.',
    'auth/code-expired': 'Verification code has expired.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Sign-in popup was blocked by your browser.',
    'auth/requires-recent-login': 'Please sign in again to perform this action.',
    'auth/provider-already-linked': 'This account is already linked to another provider.',
    'auth/credential-already-in-use': 'These credentials are already associated with a different user account.',
    'auth/invalid-api-key': 'Invalid Firebase API key. Please check your configuration.',
    'auth/app-deleted': 'Firebase app has been deleted.',
    'auth/app-not-authorized': 'Firebase app is not authorized to use Firebase Authentication.',
    'auth/argument-error': 'Invalid argument provided to Firebase Authentication method.',
    'auth/invalid-user-token': 'Invalid user token.',
    'auth/user-token-expired': 'User token has expired.',
    'auth/web-storage-unsupported': 'Web storage is not supported or is disabled.',
  };

  if (errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (errorMessage.includes('Firebase:')) {
    const match = errorMessage.match(/Firebase: Error \([^)]+\)\. (.+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return 'An unexpected error occurred. Please try again.';
}
