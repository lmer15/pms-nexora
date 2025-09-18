import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { facilityShareService } from '../api/facilityShareService';

interface ShareLinkDetails {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityDescription?: string;
  role: string;
  expiresAt: string | null;
  usageCount: number;
  isActive: boolean;
}

const JoinFacility: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  
  const [shareLink, setShareLink] = useState<ShareLinkDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (linkId) {
      fetchShareLinkDetails();
    }
  }, [linkId]);

  const fetchShareLinkDetails = async () => {
    try {
      setIsLoading(true);
      // For authenticated users, we'll show the join interface
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Show the join interface - we'll validate the link when they click join
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired share link');
      setIsLoading(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!user || !linkId) return;

    try {
      setIsJoining(true);
      // Instead of automatically joining, create a join request
      const response = await facilityShareService.requestToJoinViaShareLink(linkId);
      
      setSuccess('Join request submitted successfully! You will be notified when an admin approves your request.');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit join request');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold mb-2">Loading Share Link</h2>
          <p className="text-gray-600">Please wait while we verify the share link...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2 text-red-600">Invalid Share Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="secondary">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold mb-2 text-green-600">Success!</h2>
          <p className="text-gray-600">{success}</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold mb-2">Join Facility</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to join this facility. Please log in or create an account to continue.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/login')} className="w-full">
              Log In
            </Button>
            <Button onClick={() => navigate('/login')} variant="secondary" className="w-full">
              Create Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          {/* User Profile Picture */}
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-semibold text-white text-lg relative overflow-hidden">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide the image and show fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.fallback-initials') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className={`fallback-initials absolute inset-0 flex items-center justify-center ${user?.photoURL ? 'hidden' : 'flex'}`}
              style={{ backgroundColor: '#6B7280' }}
            >
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          <Building2 size={48} className="mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold mb-2">Join Facility</h2>
          <p className="text-gray-600 mb-2">You've been invited to join a facility via share link.</p>

          {/* User Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {user?.displayName || user?.email}
            </p>
            <p className="text-xs text-gray-600">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 text-sm">
              Click "Request to Join" below to submit a join request. A facility admin will review and approve your request.
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>⏰ Note:</strong> Share links typically expire after 7 days for security purposes.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={handleRequestToJoin}
              disabled={isJoining}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isJoining ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Request to Join
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JoinFacility;
