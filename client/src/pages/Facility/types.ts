export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  assigneeName?: string;
  assigneeProfilePicture?: string;
  assignees?: Array<{
    id: string;
    name: string;
    profilePicture?: string;
  }>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  estimatedDuration?: number;
  actualCompletionDate?: string;
  progress?: number;
  pinned?: boolean;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  _projectStatus?: string;
  status?: string;
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
  // Add other facility properties as needed
}

export interface Project {
  id: string;
  name: string;
  facilityId: string;
  creatorId: string;
  assignees: string[];
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'critical';
  archived: boolean;
  // Add other project properties as needed
}
