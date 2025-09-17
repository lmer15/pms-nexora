export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  dueDate?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
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
  status: string;
  archived: boolean;
  // Add other project properties as needed
}
