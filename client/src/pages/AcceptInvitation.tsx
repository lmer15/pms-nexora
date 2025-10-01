import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useFacility } from '../context/FacilityContext';
import { facilityShareService } from '../api/facilityShareService';

interface InvitationDetails {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityDescription?: string;
  inviterName: string;
  role: string;
  expiresAt: string;
  status: string;
  statusMessage?: string;
}

const AcceptInvitation: React.FC = () => {
  const { token: invitationToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const { refreshFacilities } = useFacility();
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (invitationToken) {
      fetchInvitationDetails();
    }
  }, [invitationToken]);

  const fetchInvitationDetails = async () => {
    try {
      setIsLoading(true);
      const response = await facilityShareService.getInvitationDetails(invitationToken!);
      const invitationData = response.invitation;
      
      // Check if invitation has a status message (expired, accepted, etc.)
      if (invitationData.statusMessage) {
        setError(invitationData.statusMessage);
      } else {
        setInvitation(invitationData);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    try {
      setIsAccepting(true);
      const response = await facilityShareService.acceptInvitation(invitationToken!);
      
      // Immediately refresh the facility list so the user sees the new facility
      await refreshFacilities();
      
      setSuccess('Invitation accepted successfully! Redirecting to facility...');
      
      setTimeout(() => {
        navigate(`/facility/${invitation.facilityId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!invitation) return;

    try {
      await facilityShareService.rejectInvitation(invitationToken!);
      
      setSuccess('Invitation rejected.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reject invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold mb-2">Loading Invitation</h2>
          <p className="text-gray-600">Please wait while we verify your invitation...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2 text-red-600">Invalid Invitation</h2>
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
          <h2 className="text-xl font-semibold mb-2">Facility Invitation</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to accept this invitation. Please log in or create an account to continue.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/auth/login')} className="w-full">
              Log In
            </Button>
            <Button onClick={() => navigate('/auth/register')} variant="secondary" className="w-full">
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
          <Building2 size={48} className="mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold mb-2">Facility Invitation</h2>
        </div>

        {invitation && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">{invitation.facilityName}</h3>
              {invitation.facilityDescription && (
                <p className="text-blue-700 text-sm mt-1">{invitation.facilityDescription}</p>
              )}
              <p className="text-blue-600 text-sm mt-2">
                <strong>{invitation.inviterName}</strong> invited you to join as a <strong>{invitation.role}</strong>
              </p>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Expires:</strong> {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleAcceptInvitation}
                disabled={isAccepting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isAccepting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Accept Invitation
              </Button>
              <Button 
                onClick={handleRejectInvitation}
                variant="destructive"
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AcceptInvitation;
