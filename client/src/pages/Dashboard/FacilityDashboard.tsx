import React from 'react';

const FacilityDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Facility Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Total Facilities</h2>
            <p className="text-2xl font-bold text-blue-600">5</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Active Projects</h2>
            <p className="text-2xl font-bold text-green-600">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Pending Tasks</h2>
            <p className="text-2xl font-bold text-yellow-600">8</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Team Members</h2>
            <p className="text-2xl font-bold text-purple-600">24</p>
          </div>
        </div>
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <ul className="space-y-2">
            <li className="text-gray-600">New project "Website Redesign" created</li>
            <li className="text-gray-600">Task "Update API" completed</li>
            <li className="text-gray-600">New member joined the team</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
