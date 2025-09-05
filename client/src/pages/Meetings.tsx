import React, { useState, useEffect } from 'react';
import { LucideMessageSquare, LucidePlus } from 'lucide-react';

const meetings = [
  {
    id: 1,
    title: 'Sprint Planning',
    date: '2023-10-05',
    time: '10:00 AM',
    location: 'Conference Room A',
    notes: 'Discuss sprint goals and tasks.',
  },
  {
    id: 2,
    title: 'Design Review',
    date: '2023-10-10',
    time: '2:00 PM',
    location: 'Zoom',
    notes: 'Review UI/UX designs and feedback.',
  },
];

const Meetings: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-4 space-y-4 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meetings</h1>
        <button className="flex items-center space-x-2 px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-xs">
          <LucidePlus className="w-4 h-4" />
          <span>Add Meeting</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand/10">
            <LucideMessageSquare className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Meetings</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{meetings.length}</p>
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{meeting.title}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{meeting.date} at {meeting.time}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{meeting.location}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{meeting.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Meetings;
