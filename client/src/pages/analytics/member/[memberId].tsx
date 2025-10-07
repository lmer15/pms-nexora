import React from 'react';
import { useParams } from 'react-router-dom';
import MemberDashboard from '../../../components/analytics/member/MemberDashboard';

const MemberAnalyticsPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();

  if (!memberId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Not Found</h1>
          <p className="text-gray-600">The requested member could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MemberDashboard />
      </div>
    </div>
  );
};

export default MemberAnalyticsPage;
