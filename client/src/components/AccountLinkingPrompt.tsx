import React, { useState } from 'react';
import { accountLinkingService } from '../api/accountLinkingService';

interface AccountLinkingPromptProps {
  email: string;
  existingMethod: 'google' | 'email_password';
  onLinkAccount: (password: string) => Promise<void>;
  onUseExistingMethod: () => void;
  onCancel: () => void;
}

const AccountLinkingPrompt: React.FC<AccountLinkingPromptProps> = ({
  email,
  existingMethod,
  onLinkAccount,
  onUseExistingMethod,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      // Pass empty string - the parent component will use the login form password
      await onLinkAccount('');
    } catch (err: any) {
      setError(err.message || 'Failed to link account');
    } finally {
      setLoading(false);
    }
  };

  const getMethodDisplayName = (method: string) => {
    return method === 'google' ? 'Google' : 'Email/Password';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🔗 Link Your Account
          </h3>
          <p className="text-sm text-gray-600">
            We found that <strong>{email}</strong> is linked to a {getMethodDisplayName(existingMethod)} account.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {existingMethod === 'google' 
              ? 'Would you like to add email/password login to your account?'
              : 'Would you like to add Google login to your account?'
            }
          </p>
          {existingMethod === 'google' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded mt-3 text-sm">
              <p><strong>💡 Smart linking:</strong> We'll use the password you just entered in the login form.</p>
            </div>
          )}
          {existingMethod === 'email_password' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded mt-3 text-sm">
              <p><strong>💡 Smart linking:</strong> We'll authenticate you with Google to link your accounts.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleLinkAccount}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:bg-green-400"
          >
{loading ? 'Linking...' : (existingMethod === 'google' ? 'Link with Current Password' : 'Link with Google')}
          </button>
          <button
            type="button"
            onClick={onUseExistingMethod}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition"
          >
            Use {getMethodDisplayName(existingMethod)}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>💡 <strong>Smart linking:</strong> We'll automatically use the password you just entered in the login form.</p>
          <p className="mt-1">After linking, you can login using either method.</p>
        </div>
      </div>
    </div>
  );
};

export default AccountLinkingPrompt;
