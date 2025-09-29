import React from 'react';
import {
  LucideUser,
  LucideCalendar,
  LucideFlag,
  LucideTrendingUp,
  LucideClock,
  LucideCheckCircle,
  LucideTag,
  LucideAlertTriangle,
  LucideFile,
  LucideHistory,
  LucidePlus,
  LucideGitBranch,
  LucideX
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Task } from '../../api/taskService';
import { facilityService, FacilityMember } from '../../api/facilityService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface TaskDetailCoreDetailsProps {
  task: Task;
  isDarkMode: boolean;
  editedTask?: Partial<Task>;
  onFieldChange?: (field: keyof Task, value: any) => void;
  onFieldChangeAndSave?: (field: keyof Task, value: any) => Promise<void>;
  comments?: any[];
  activityLogs?: any[];
  onSwitchToComments?: () => void;
  subtasks?: any[];
  facilityId?: string;
  excludeUserId?: string;
  dependencies?: any[];
  onSwitchToDependencies?: () => void;
  onSwitchToSubtasks?: () => void;
}

const TaskDetailCoreDetails: React.FC<TaskDetailCoreDetailsProps> = ({
  task,
  isDarkMode,
  editedTask = {},
  onFieldChange,
  onFieldChangeAndSave,
  comments = [],
  activityLogs = [],
  onSwitchToComments,
  subtasks = [],
  facilityId,
  excludeUserId,
  dependencies = [],
  onSwitchToDependencies,
  onSwitchToSubtasks
}) => {
  const [editingField, setEditingField] = React.useState<string | null>(null);
  const [facilityMembers, setFacilityMembers] = React.useState<FacilityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = React.useState(false);
  const [assigneeSearch, setAssigneeSearch] = React.useState('');
  const [newTag, setNewTag] = React.useState('');
  const [showTagInput, setShowTagInput] = React.useState(false);
  const [tagSuggestions, setTagSuggestions] = React.useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = React.useState(false);
  const [recentTags, setRecentTags] = React.useState<string[]>([]);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);
  const tagInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (facilityId) {
      loadFacilityMembers();
    }
  }, [facilityId]);

  // Handle click outside to close priority dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setEditingField(null);
      }
    };

    if (editingField === 'priority') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingField]);

  const loadFacilityMembers = async () => {
    if (!facilityId) return;
    setLoadingMembers(true);
    try {
      const members = await facilityService.getFacilityMembers(facilityId);
      setFacilityMembers(members);
    } catch (error) {
      console.error('Failed to load facility members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const filteredMembers = facilityMembers.filter(m => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return true;
    const name = m.name?.toLowerCase?.() || '';
    const email = m.email?.toLowerCase?.() || '';
    return name.includes(q) || email.includes(q);
  });

  const filteredAndExcludedMembers = filteredMembers.filter(m => {
    // Exclude the project owner
    if (m.id === excludeUserId) return false;
    
    // Exclude already assigned members
    const currentAssignees = editedTask.assignees || task.assignees || [];
    const singleAssignee = editedTask.assignee || task.assignee;
    const allAssignees = currentAssignees.length > 0 ? currentAssignees : (singleAssignee ? [singleAssignee] : []);
    
    return !allAssignees.includes(m.id);
  });

  const currentTags: string[] = (editedTask.tags ?? task.tags ?? []) as string[];

  // Predefined tag suggestions organized by category
  const predefinedTags = {
    priority: ['urgent', 'high-priority', 'low-priority', 'critical'],
    type: ['bug', 'feature', 'enhancement', 'documentation', 'testing', 'research'],
    status: ['blocked', 'waiting-review', 'in-review', 'ready-for-testing'],
    team: ['frontend', 'backend', 'design', 'devops', 'marketing'],
    time: ['quick-win', 'sprint-goal', 'technical-debt'],
    client: ['client-urgent', 'internal', 'client-request']
  };

  // Get tag suggestions based on input
  const getTagSuggestions = (input: string) => {
    if (!input.trim()) {
      // Show recent tags and popular predefined tags when input is empty
      const popularTags = [
        'bug', 'feature', 'urgent', 'frontend', 'backend', 
        'testing', 'documentation', 'enhancement', 'quick-win'
      ];
      return [...recentTags, ...popularTags.filter(tag => !recentTags.includes(tag))].slice(0, 8);
    }

    const allPredefinedTags = Object.values(predefinedTags).flat();
    const matchingTags = allPredefinedTags.filter(tag => 
      tag.toLowerCase().includes(input.toLowerCase()) && 
      !currentTags.includes(tag)
    );
    
    return matchingTags.slice(0, 6);
  };

  // Handle tag input change with suggestions
  const handleTagInputChange = (value: string) => {
    setNewTag(value);
    const suggestions = getTagSuggestions(value);
    setTagSuggestions(suggestions);
    setShowTagSuggestions(suggestions.length > 0);
  };

  // Add tag from suggestion
  const addTagFromSuggestion = async (tag: string) => {
    if (currentTags.includes(tag)) return;
    
    const next = [...currentTags, tag];
    handleInputChange('tags', next);
    setNewTag('');
    setShowTagSuggestions(false);
    
    // Update recent tags
    setRecentTags(prev => [tag, ...prev.filter(t => t !== tag)].slice(0, 10));
    
    // Auto-save to database
    try {
      if (onFieldChangeAndSave) {
        await onFieldChangeAndSave('tags', next);
      }
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  };

  const handleAddTag = async () => {
    const value = newTag.trim();
    if (!value) return;
    if (currentTags.includes(value)) {
      setNewTag('');
      return;
    }
    const next = [...currentTags, value];
    handleInputChange('tags', next);
    setNewTag('');
    setShowTagInput(false); // Hide input after adding
    setShowTagSuggestions(false);
    
    // Update recent tags
    setRecentTags(prev => [value, ...prev.filter(t => t !== value)].slice(0, 10));
    
    // Auto-save to database
    try {
      if (onFieldChangeAndSave) {
        await onFieldChangeAndSave('tags', next);
      }
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    const next = currentTags.filter(t => t !== tag);
    handleInputChange('tags', next);
    
    // Auto-save to database
    try {
      if (onFieldChangeAndSave) {
        await onFieldChangeAndSave('tags', next);
      }
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'urgent':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <LucideAlertTriangle className="w-3 h-3" />;
      default:
        return <LucideFlag className="w-3 h-3" />;
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString?: any, includeTime = false) => {
    if (!dateString) return '';
    let date: Date;
    if (dateString.toDate && typeof dateString.toDate === 'function') {
      // Handle Firestore Timestamp object
      date = dateString.toDate();
    } else if (typeof dateString === 'string' || dateString instanceof Date) {
      date = new Date(dateString);
    } else {
      return '';
    }
    if (isNaN(date.getTime())) return '';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }
    return date.toLocaleDateString('en-US', options);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getProgressColorWithGradient = (progress: number) => {
    if (progress >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (progress >= 50) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (progress >= 25) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const getProgressStatus = (progress: number) => {
    if (progress >= 80) return 'Excellent';
    if (progress >= 50) return 'Good';
    if (progress >= 25) return 'In Progress';
    return 'Getting Started';
  };

  // Safely render activity content, handling HTML tags and plain text
  const renderActivityContent = (content: string) => {
    if (!content) return content;
    
    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content);
    
    if (hasHtmlTags) {
      // Clean up common HTML issues and render safely
      let cleanContent = content
        // Remove empty divs with just breaks
        .replace(/<div><br\s*\/?><\/div>/gi, '')
        // Convert div breaks to line breaks
        .replace(/<div><br\s*\/?><\/div>/gi, '<br>')
        // Clean up empty paragraphs
        .replace(/<p><br\s*\/?><\/p>/gi, '')
        // Convert paragraph breaks to line breaks
        .replace(/<p><br\s*\/?><\/p>/gi, '<br>')
        // Remove empty tags
        .replace(/<(\w+)><\/\1>/gi, '')
        // Trim whitespace
        .trim();
      
      // If content is empty after cleaning, return a placeholder
      if (!cleanContent || cleanContent === '') {
        return <span className="italic opacity-60">Empty content</span>;
      }
      
      return <span dangerouslySetInnerHTML={{ __html: cleanContent }} />;
    } else {
      // If it's plain text, return as is
      return content;
    }
  };

  // Calculate progress from subtasks
  const safeSubtasks = subtasks || [];
  const completedSubtasks = safeSubtasks.filter(st => st && st.completed === true);
  const calculatedProgress = safeSubtasks.length > 0 ? Math.round((completedSubtasks.length / safeSubtasks.length) * 100) : 0;

  // Calculate dependency summary
  const blockedByCount = dependencies.filter(dep => dep.dependencyType === 'blocked-by').length;
  const blocksCount = dependencies.filter(dep => dep.dependencyType === 'blocks').length;
  const relatedCount = dependencies.filter(dep => dep.dependencyType === 'related').length;
  const totalDependencies = dependencies.length;

  // Use calculated progress from subtasks if subtasks exist, otherwise use manual task progress
  const displayProgress = safeSubtasks.length > 0 ? calculatedProgress : (task.progress !== undefined ? task.progress : 0);
  
  // Debug logging (remove in production)
  if (safeSubtasks.length > 0) {
    console.log('Progress Debug:', {
      totalSubtasks: safeSubtasks.length,
      completedSubtasks: completedSubtasks.length,
      calculatedProgress,
      displayProgress,
      taskProgress: task.progress,
      subtasksData: safeSubtasks.map(st => ({ id: st.id, title: st.title, completed: st.completed }))
    });
  }

  // Combine and sort recent activities
  const recentActivities = [
    ...comments.map(c => ({ ...c, type: 'comment' })),
    ...activityLogs.map(a => ({ ...a, type: 'activity' }))
  ].sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime()).slice(0, 2);

  return (
    <div className="p-6 space-y-6">
      {/* Primary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assignee */}
        <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <LucideUser className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Assignee
              </p>
              <div className={`mt-1 relative`}>
                {/* Always show the compact assignee display */}
                  <div className="flex items-center gap-2 min-h-[32px]">
                    {/* Show current assignees (from editedTask or task) */}
                    {(() => {
                      const currentAssignees = editedTask.assignees || task.assignees || [];
                      const singleAssignee = editedTask.assignee || task.assignee;
                      
                      // Handle backward compatibility - if there's a single assignee but no assignees array
                      const allAssignees = currentAssignees.length > 0 ? currentAssignees : (singleAssignee ? [singleAssignee] : []);
                      
                      return (
                        <div className="flex items-center gap-1">
                          {/* Display assignee profiles */}
                          {allAssignees.map((assigneeId, index) => {
                            const member = facilityMembers.find(m => m.id === assigneeId);
                            const fullName = member ? member.name : '';
                            const profileSrc = member?.profilePicture;
                            const fallbackInitial = (member?.name?.charAt(0) || member?.email?.charAt(0) || '?').toUpperCase();
                            
                            return (
                              <div key={assigneeId} className="relative group">
                                <div 
                                  className="w-7 h-7 rounded-full overflow-hidden bg-brand text-white flex items-center justify-center text-xs font-medium cursor-pointer"
                                  title={fullName}
                                >
                                  {profileSrc ? (
                                    <img src={profileSrc} alt={fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    fallbackInitial
                                  )}
                                </div>
                                {/* X icon on hover */}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const updatedAssignees = allAssignees.filter(id => id !== assigneeId);
                                    handleInputChange('assignees', updatedAssignees);
                                    try {
                                      if (onFieldChangeAndSave) {
                                        await onFieldChangeAndSave('assignees', updatedAssignees);
                                      }
                                    } catch (error) {
                                      console.error('Failed to remove assignee:', error);
                                    }
                                  }}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  title={`Remove ${fullName}`}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                          
                          {/* Plus button to add more assignees */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAssigneeDropdown(true);
                            }}
                            className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
                              isDarkMode 
                                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                            }`}
                            title="Add assignee"
                          >
                            <LucidePlus className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                
                {/* Dropdown for adding assignees */}
                {showAssigneeDropdown && (
                  <div
                    className={`absolute top-full left-0 right-0 mt-1 border rounded shadow-lg z-50 max-h-60 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    onMouseLeave={() => {
                      setShowAssigneeDropdown(false);
                      setAssigneeSearch('');
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`px-3 pt-3 pb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        placeholder="Search members..."
                        className={`w-full px-3 py-2 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:ring-2 focus:ring-brand focus:border-transparent' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent'}`}
                      />
                    </div>
                    {loadingMembers ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                    ) : filteredAndExcludedMembers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No members found</div>
                    ) : (
                      filteredAndExcludedMembers.map(member => (
                        <div
                          key={member.id}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            
                            // Get current assignees
                            const currentAssignees = editedTask.assignees || task.assignees || [];
                            const singleAssignee = editedTask.assignee || task.assignee;
                            const allAssignees = currentAssignees.length > 0 ? currentAssignees : (singleAssignee ? [singleAssignee] : []);
                            
                            // Add new assignee if not already assigned
                            if (!allAssignees.includes(member.id)) {
                              const updatedAssignees = [...allAssignees, member.id];
                              handleInputChange('assignees', updatedAssignees);
                              
                              // Auto-save to database
                              try {
                                if (onFieldChangeAndSave) {
                                  await onFieldChangeAndSave('assignees', updatedAssignees);
                                }
                              } catch (error) {
                                console.error('Failed to save assignee:', error);
                              }
                            }
                            
                            setShowAssigneeDropdown(false);
                            setAssigneeSearch('');
                          }}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-brand text-white flex items-center justify-center text-xs font-medium">
                            {member.profilePicture ? (
                              <img src={member.profilePicture} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              (member.name?.charAt(0) || member.email?.charAt(0) || '?').toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm font-medium truncate`}>
                              {member.name || 'Member'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Due Date */}
        <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <LucideCalendar className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Due Date
              </p>
              <div className="mt-1 relative">
                {editingField === 'dueDate' ? (
                  <DatePicker
                    selected={editedTask.dueDate ? new Date(editedTask.dueDate) : (task.dueDate ? new Date(task.dueDate) : null)}
                    onChange={async (date) => {
                      const dateValue = date ? date.toISOString().split('T')[0] : '';
                      handleInputChange('dueDate', dateValue);
                      setEditingField(null);
                      
                      // Auto-save to database
                      try {
                        if (onFieldChangeAndSave) {
                          await onFieldChangeAndSave('dueDate', dateValue);
                        }
                      } catch (error) {
                        console.error('Failed to save due date:', error);
                      }
                    }}
                    dateFormat="MMM dd, yyyy"
                    className={`text-sm font-medium w-full ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent`}
                    placeholderText="Select due date"
                    autoFocus
                  />
                ) : (
                  <div 
                    className="flex items-center gap-2 min-h-[32px]"
                    onClick={() => setEditingField('dueDate')}
                  >
                    <div className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors`}>
                      <span className={`text-sm font-medium ${
                        (editedTask.dueDate || task.dueDate) && isOverdue(editedTask.dueDate || task.dueDate)
                          ? 'text-red-600 dark:text-red-400'
                          : isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {editedTask.dueDate || task.dueDate ? (
                          <>
                            {formatDate(editedTask.dueDate || task.dueDate)}
                            {isOverdue(editedTask.dueDate || task.dueDate) && (
                              <span className="ml-1 text-xs">(Overdue)</span>
                            )}
                          </>
                        ) : (
                          'Set due date'
                        )}
                      </span>
                    </div>
                    {(editedTask.dueDate || task.dueDate) && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          handleInputChange('dueDate', '');
                          try {
                            if (onFieldChangeAndSave) {
                              await onFieldChangeAndSave('dueDate', '');
                            }
                          } catch (error) {
                            console.error('Failed to remove due date:', error);
                          }
                        }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity ${
                          isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title="Remove due date"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Priority */}
        <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <LucideFlag className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Priority
              </p>
              <div className="mt-1 relative" ref={priorityDropdownRef}>
                <div 
                  className="flex items-center gap-2 min-h-[32px]"
                  onClick={() => setEditingField(editingField === 'priority' ? null : 'priority')}
                >
                  <div className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors`}>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(editedTask.priority ?? task.priority)}`}>
                      {getPriorityIcon(editedTask.priority ?? task.priority)}
                      {((editedTask.priority ?? task.priority) || 'medium').charAt(0).toUpperCase() + ((editedTask.priority ?? task.priority) || 'medium').slice(1)}
                    </span>
                  </div>
                </div>
                
                {/* Dropdown */}
                {editingField === 'priority' && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-1 min-w-[140px]">
                    <div className="flex flex-col gap-0.5">
                      {['low', 'medium', 'high', 'urgent'].map((priority) => (
                        <button
                          key={priority}
                          onClick={async () => {
                            handleInputChange('priority', priority);
                            setEditingField(null);
                            
                            // Auto-save to database
                            try {
                              if (onFieldChangeAndSave) {
                                await onFieldChangeAndSave('priority', priority);
                              }
                            } catch (error) {
                              console.error('Failed to save priority:', error);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-full border transition-all hover:scale-105 w-full justify-start ${getPriorityColor(priority)}`}
                        >
                          {getPriorityIcon(priority)}
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dependencies Preview */}
        <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <LucideGitBranch className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Dependencies
                </p>
                {onSwitchToDependencies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSwitchToDependencies}
                    className="text-xs h-6 px-2"
                  >
                    View All
                  </Button>
                )}
              </div>
              {totalDependencies > 0 ? (
                <div className="space-y-1">
                  {blockedByCount > 0 && (
                    <div className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      Blocked by {blockedByCount} task{blockedByCount !== 1 ? 's' : ''}
                    </div>
                  )}
                  {blocksCount > 0 && (
                    <div className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Blocks {blocksCount} task{blocksCount !== 1 ? 's' : ''}
                    </div>
                  )}
                  {relatedCount > 0 && (
                    <div className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Related to {relatedCount} task{relatedCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ) : (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No dependencies
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Subtasks & Progress */}
        <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <LucideTrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Progress & Subtasks
                </p>
                {onSwitchToSubtasks && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSwitchToSubtasks}
                    className="text-xs h-6 px-2"
                  >
                    View All
                  </Button>
                )}
              </div>
              {safeSubtasks.length > 0 ? (
                <div className="space-y-3">
                  {/* Progress Bar with Enhanced Styling */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Progress
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          displayProgress >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          displayProgress >= 50 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          displayProgress >= 25 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {getProgressStatus(displayProgress)}
                        </span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {displayProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner`}>
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColorWithGradient(displayProgress)} shadow-sm relative overflow-hidden`}
                          style={{ width: `${displayProgress}%` }}
                        >
                          {/* Animated shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${
                        isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <div className="text-center">
                          <div className="font-semibold">{displayProgress}% Complete</div>
                          <div className="text-xs opacity-75">{completedSubtasks.length} of {safeSubtasks.length} subtasks done</div>
                        </div>
                        {/* Tooltip arrow */}
                        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                          isDarkMode ? 'border-t-gray-800' : 'border-t-white'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  {/* Subtask Count with Enhanced Styling */}
                  <div className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Subtask Progress
                    </span>
                    <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {completedSubtasks.length} of {safeSubtasks.length} completed
                    </span>
                  </div>
                </div>
              ) : task.progress !== undefined ? (
                <div className="space-y-3">
                  {/* Manual Progress Bar with Enhanced Styling */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Progress
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          displayProgress >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          displayProgress >= 50 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          displayProgress >= 25 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {getProgressStatus(displayProgress)}
                        </span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {displayProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner`}>
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColorWithGradient(displayProgress)} shadow-sm relative overflow-hidden`}
                          style={{ width: `${displayProgress}%` }}
                        >
                          {/* Animated shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${
                        isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <div className="text-center">
                          <div className="font-semibold">{displayProgress}% Complete</div>
                          <div className="text-xs opacity-75">Manual progress tracking</div>
                        </div>
                        {/* Tooltip arrow */}
                        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                          isDarkMode ? 'border-t-gray-800' : 'border-t-white'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  {/* Manual Progress Info */}
                  <div className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Progress Type
                    </span>
                    <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Manual tracking
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* No Progress State */}
                  <div className={`text-center p-4 rounded-lg border-2 border-dashed ${
                    isDarkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <LucideTrendingUp className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      No Progress Tracking
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Add subtasks or set manual progress to track completion
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Dates */}
        <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <LucideClock className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Dates
              </p>
              <div className="mt-2 space-y-2">
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Created
                  </p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(task.createdAt)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Last Updated
                  </p>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(task.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tags */}
      <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <LucideTag className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Tags
              </p>
              {currentTags.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {currentTags.length} tag{currentTags.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* Tags Display */}
            <div className="mb-4">
              {currentTags.length === 0 ? (
                <div className={`text-center py-6 border-2 border-dashed rounded-lg ${
                  isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
                }`}>
                  <LucideTag className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tags added yet</p>
                  <p className="text-xs mt-1 opacity-75">Add tags to organize and categorize this task</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentTags.map(tag => (
                    <span 
                      key={tag} 
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-brand/20 border border-brand/30 text-brand-300 hover:bg-brand/30' 
                          : 'bg-brand/10 border border-brand/20 text-brand-700 hover:bg-brand/20'
                      }`}
                    >
                      <span className="truncate max-w-[120px]" title={tag}>
                        {tag}
                      </span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className={`rounded-full p-0.5 transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' 
                            : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                        }`}
                        title="Remove tag"
                      >
                        <LucideX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Add Tag Section */}
            {showTagInput ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={newTag}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tagSuggestions.length > 0) {
                            addTagFromSuggestion(tagSuggestions[0]);
                          } else {
                            handleAddTag();
                          }
                        } else if (e.key === 'Escape') {
                          setShowTagInput(false);
                          setNewTag('');
                          setShowTagSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        const suggestions = getTagSuggestions(newTag);
                        setTagSuggestions(suggestions);
                        setShowTagSuggestions(suggestions.length > 0);
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicking on them
                        setTimeout(() => setShowTagSuggestions(false), 200);
                      }}
                      placeholder="Type a tag name or select from suggestions..."
                      className={`w-full px-3 py-2 pl-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-750' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50'
                      }`}
                      autoFocus
                    />
                    <LucideTag className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    
                    {/* Tag Suggestions Dropdown */}
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        {tagSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            onClick={() => addTagFromSuggestion(suggestion)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-opacity-50 transition-colors ${
                              index === 0 ? 'bg-brand/10' : ''
                            } ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <LucideTag className="w-3 h-3 opacity-50" />
                              <span>{suggestion}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleAddTag} 
                    disabled={!newTag.trim()}
                    className="px-4 py-2 bg-brand hover:bg-brand/90 text-white border-0 transition-all duration-200"
                  >
                    <LucidePlus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setShowTagInput(false);
                      setNewTag('');
                    }}
                    className="px-3 py-2"
                  >
                    <LucideX className="w-4 h-4" />
                  </Button>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Press Enter to add, Escape to cancel
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowTagInput(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2 border-dashed ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-400 hover:border-brand/50 hover:text-brand-300 hover:bg-brand/10' 
                      : 'border-gray-300 text-gray-500 hover:border-brand/50 hover:text-brand-600 hover:bg-brand/10'
                  }`}
                >
                  <LucidePlus className="w-3 h-3" />
                  <span>Add Tag</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <LucideFile className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Description
            </p>
            <div
              className={`rounded px-2 py-1 relative`}
              onClick={() => setEditingField(editingField === 'description' ? null : 'description')}
            >
              {editingField === 'description' ? (
                <textarea
                  className={`text-sm leading-relaxed w-full min-h-[100px] resize-y ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent`}
                  placeholder="Add task details here..."
                  value={editedTask.description ?? task.description ?? ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onBlur={async () => {
                    setEditingField(null);
                    
                    // Auto-save to database when user finishes editing
                    try {
                      if (onFieldChangeAndSave) {
                        await onFieldChangeAndSave('description', editedTask.description ?? task.description ?? '');
                      }
                    } catch (error) {
                      console.error('Failed to save description:', error);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {task.description || 'Add task details here...'}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity Preview */}
      {recentActivities.length > 0 && (
        <Card className={`p-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <LucideHistory className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Recent Activity
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSwitchToComments}
                  className={`text-xs ${isDarkMode ? 'text-brand hover:text-brand/80' : 'text-brand hover:text-brand/80'}`}
                >
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                {recentActivities.map((activity, index) => (
                  <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {renderActivityContent(activity.type === 'comment' ? activity.content : activity.description)}
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(activity.createdAt || activity.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Actions */}
    </div>
  );
};

export default TaskDetailCoreDetails;
