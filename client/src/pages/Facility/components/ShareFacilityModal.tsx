import React, { useState, ChangeEvent } from 'react';
import { LucideX } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';

interface Member {
  id: string;
  name: string;
  username: string;
  role: string;
  avatarColor: string;
}

interface ShareFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  isDarkMode: boolean;
}

const roles = ['Admin', 'Member', 'Guest'];

const ShareFacilityModal: React.FC<ShareFacilityModalProps> = ({ isOpen, onClose, members, isDarkMode }) => {
  const [selectedTab, setSelectedTab] = useState<'members' | 'joinRequests'>('members');
  const [emailOrName, setEmailOrName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className={`w-full max-w-lg mx-4 rounded-lg shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`px-6 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <h2 className="text-lg font-semibold">Share facility</h2>
          <button onClick={onClose} aria-label="Close modal" className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <LucideX size={20} />
          </button>
        </div>

        {/* Email input and share */}
        <div className={`flex items-center space-x-2 p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <Input
            type="text"
            placeholder="Email address or name"
            value={emailOrName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmailOrName(e.target.value)}
            className="flex-grow"
          />
          <select
            value={selectedRole}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRole(e.target.value)}
            className={`border rounded-md px-2 py-1 text-sm focus:ring-brand ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'}`}
          >
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <Button variant="primary" size="sm" disabled={!emailOrName.trim()} className="bg-green-600 hover:bg-green-700 focus:ring-green-500">
            Share
          </Button>
        </div>

        {/* Link sharing section */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <div className={`flex items-center justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-1`}>
            <div className="flex items-center space-x-2">
              <svg
                className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 14.828a4 4 0 01-5.656-5.656m0 0L9 9m4.828 5.828L15 15" />
              </svg>
              <span className="ml-1">Anyone with the link can join as a member</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <button className="text-green-500 hover:underline">Copy link</button>
              <button className="text-red-500 hover:underline">Delete link</button>
              <select
                className={`ml-4 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'} border rounded-md px-2 py-1 text-sm focus:ring-4 focus:ring-brand`}
                defaultValue="Member"
                style={{ minWidth: '6rem' }}
              >
                <option>Admin</option>
                <option>Member</option>
                <option>Guest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <button
            className={`flex-1 py-2 ${selectedTab === 'members' ? 'border-b-2 border-green-500 text-green-500' : ''}`}
            onClick={() => setSelectedTab('members')}
          >
            Facility members {members.length}
          </button>
          <button
            className={`flex-1 py-2 ${selectedTab === 'joinRequests' ? 'border-b-2 border-green-500 text-green-500' : ''}`}
            onClick={() => setSelectedTab('joinRequests')}
          >
            Join requests
          </button>
        </div>

        {/* Members or Join Requests List */}
        <div className="flex-grow overflow-y-auto p-6">
          {selectedTab === 'members' ? (
            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white`}
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name.charAt(0).toUpperCase()}{member.name.charAt(1)?.toUpperCase() || ''}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{member.name} {member.id === 'you' ? '(you)' : ''}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{member.username} &bull; Workspace {member.role.toLowerCase()}</p>
                    </div>
                  </div>
                  <select
                    className={`border rounded-md px-2 py-1 text-sm focus:ring-4 focus:ring-brand ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900'}`}
                    defaultValue={member.role}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No join requests</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareFacilityModal;
