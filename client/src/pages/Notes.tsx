import React, { useState, useEffect } from 'react';
import { LucideFileText, LucidePlus } from 'lucide-react';

const notes = [
  {
    id: 1,
    title: 'Meeting Notes - Project Kickoff',
    content: 'Discussed project timeline and deliverables...',
    createdAt: '2023-10-01',
    updatedAt: '2023-10-01',
  },
  {
    id: 2,
    title: 'Design Review',
    content: 'Reviewed wireframes and user flows...',
    createdAt: '2023-09-28',
    updatedAt: '2023-09-29',
  },
];

const Notes: React.FC = () => {
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notes</h1>
        <button className="flex items-center space-x-2 px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-xs">
          <LucidePlus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand/10">
            <LucideFileText className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Notes</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{notes.length}</p>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{note.title}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{note.updatedAt}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notes;
