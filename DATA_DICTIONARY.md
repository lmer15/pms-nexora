# PMS Nexora - Data Dictionary

## Overview
This document provides a comprehensive data dictionary for the PMS (Project Management System) Nexora, detailing all data models with technical specifications including field types, formats, sizes, and sample data.

## Database Architecture
- **Primary Database**: Google Firestore (NoSQL)
- **Real-time Database**: Firebase Realtime Database (for comments)
- **File Storage**: Local file system (for attachments)

---

## Core Data Models

### 1. User
**Collection**: `users`  
**Description**: User accounts and profile information

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | Firebase UID | 28 chars | Yes | Unique user identifier | "abc123def456ghi789jkl012mno" |
| email | string | Email format | 254 chars max | Yes | User's email address | "john.doe@company.com" |
| firstName | string | Text | 50 chars max | Yes | User's first name | "John" |
| lastName | string | Text | 50 chars max | Yes | User's last name | "Doe" |
| profilePicture | string | URL | 500 chars max | No | URL to user's profile picture | "https://example.com/avatar.jpg" |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Account creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last profile update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- One-to-many with UserFacility
- One-to-many with Task (as creator/assignee)
- One-to-many with Project (as creator)
- One-to-many with Note

---

### 2. Facility
**Collection**: `facilities`  
**Description**: Organizations or workspaces where projects are managed

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique facility identifier | "550e8400-e29b-41d4-a716-446655440000" |
| name | string | Text | 100 chars max | Yes | Facility name | "Acme Corporation" |
| description | string | Text | 500 chars max | No | Facility description | "Software development company" |
| status | enum | String | 10 chars | Yes | 'active', 'inactive', 'archived' | "active" |
| ownerId | string | Firebase UID | 28 chars | Yes | ID of the facility owner | "abc123def456ghi789jkl012mno" |
| members | array | Array of strings | Variable | Yes | Array of member user IDs | ["uid1", "uid2", "uid3"] |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Facility creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- One-to-many with Project
- One-to-many with UserFacility
- One-to-many with FacilityInvitation
- One-to-many with FacilityShareLink
- One-to-many with Note

---

### 3. UserFacility
**Collection**: `userFacilities`  
**Description**: Junction table for user-facility relationships and roles

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique relationship identifier | "550e8400-e29b-41d4-a716-446655440001" |
| userId | string | Firebase UID | 28 chars | Yes | User ID | "abc123def456ghi789jkl012mno" |
| facilityId | string | UUID v4 | 36 chars | Yes | Facility ID | "550e8400-e29b-41d4-a716-446655440000" |
| role | enum | String | 10 chars | Yes | 'owner', 'admin', 'member', 'guest' | "member" |
| joinedAt | timestamp | ISO 8601 | 24 chars | Yes | When user joined the facility | "2024-01-15T10:30:00.000Z" |
| lastActiveAt | timestamp | ISO 8601 | 24 chars | No | Last activity timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with User
- Many-to-one with Facility

---

### 4. Project
**Collection**: `projects`  
**Description**: Projects within facilities

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique project identifier | "550e8400-e29b-41d4-a716-446655440002" |
| name | string | Text | 100 chars max | Yes | Project name | "Website Redesign" |
| description | string | Text | 1000 chars max | No | Project description | "Complete redesign of company website" |
| facilityId | string | UUID v4 | 36 chars | Yes | Parent facility ID | "550e8400-e29b-41d4-a716-446655440000" |
| creatorId | string | Firebase UID | 28 chars | Yes | Project creator's user ID | "abc123def456ghi789jkl012mno" |
| assignees | array | Array of strings | Variable | Yes | Array of assigned user IDs | ["uid1", "uid2"] |
| status | enum | String | 15 chars | Yes | 'planning', 'in-progress', 'completed', 'on-hold', 'critical' | "in-progress" |
| archived | boolean | Boolean | 1 bit | Yes | Whether project is archived | false |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Project creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Facility
- One-to-many with Task
- Many-to-one with User (creator)

---

### 5. Task
**Collection**: `tasks`  
**Description**: Individual tasks within projects

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique task identifier | "550e8400-e29b-41d4-a716-446655440003" |
| title | string | Text | 200 chars max | Yes | Task title | "Implement user authentication" |
| description | string | Text | 2000 chars max | No | Task description | "Add login/logout functionality" |
| status | enum | String | 15 chars | Yes | 'todo', 'in-progress', 'review', 'done' | "in-progress" |
| assignee | string | Firebase UID | 28 chars | No | Primary assignee user ID (legacy) | "abc123def456ghi789jkl012mno" |
| assigneeName | string | Text | 100 chars max | No | Primary assignee display name | "John Doe" |
| assigneeIds | array | Array of strings | Variable | No | Array of assignee user IDs | ["uid1", "uid2"] |
| priority | enum | String | 10 chars | No | 'low', 'medium', 'high', 'urgent' | "high" |
| dueDate | string | ISO 8601 Date | 10 chars | No | Task due date | "2024-02-15" |
| startDate | string | ISO 8601 Date | 10 chars | No | Task start date | "2024-01-20" |
| estimatedDuration | number | Integer | 4 bytes | No | Estimated duration in hours | 8 |
| actualCompletionDate | string | ISO 8601 Date | 10 chars | No | Actual completion date | "2024-02-10" |
| progress | number | Integer | 1 byte | No | Progress percentage (0-100) | 75 |
| tags | array | Array of strings | Variable | No | Array of tag strings | ["frontend", "auth", "urgent"] |
| pinned | boolean | Boolean | 1 bit | No | Whether task is pinned | false |
| projectId | string | UUID v4 | 36 chars | Yes | Parent project ID | "550e8400-e29b-41d4-a716-446655440002" |
| creatorId | string | Firebase UID | 28 chars | Yes | Task creator's user ID | "abc123def456ghi789jkl012mno" |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Task creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Project
- One-to-many with TaskComment
- One-to-many with TaskAttachment
- One-to-many with TaskTimeLog
- One-to-many with TaskDependency
- One-to-many with TaskSubtask
- One-to-many with TaskActivityLog

---

## Task-Related Models

### 6. TaskComment
**Collection**: `taskComments` (Firebase Realtime Database)  
**Description**: Comments and discussions on tasks

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique comment identifier | "550e8400-e29b-41d4-a716-446655440004" |
| taskId | string | UUID v4 | 36 chars | Yes | Parent task ID | "550e8400-e29b-41d4-a716-446655440003" |
| creatorId | string | Firebase UID | 28 chars | Yes | Comment creator's user ID | "abc123def456ghi789jkl012mno" |
| content | string | Text | 2000 chars max | Yes | Comment content | "This looks good, but needs testing" |
| parentCommentId | string | UUID v4 | 36 chars | No | ID of parent comment (for replies) | "550e8400-e29b-41d4-a716-446655440005" |
| userProfile | object | JSON Object | Variable | Yes | User profile info (firstName, lastName, profilePicture) | {"firstName": "John", "lastName": "Doe", "profilePicture": "url"} |
| likes | array | Array of strings | Variable | No | Array of user IDs who liked | ["uid1", "uid2"] |
| dislikes | array | Array of strings | Variable | No | Array of user IDs who disliked | ["uid3"] |
| replies | array | Array of strings | Variable | No | Array of reply comment IDs | ["comment1", "comment2"] |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Comment creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Task
- Self-referencing (replies)

---

### 7. TaskAttachment
**Collection**: `taskAttachments`  
**Description**: File attachments for tasks

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique attachment identifier | "550e8400-e29b-41d4-a716-446655440006" |
| taskId | string | UUID v4 | 36 chars | Yes | Parent task ID | "550e8400-e29b-41d4-a716-446655440003" |
| uploaderId | string | Firebase UID | 28 chars | Yes | User who uploaded the file | "abc123def456ghi789jkl012mno" |
| fileName | string | Text | 255 chars max | Yes | Original file name | "design-mockup.pdf" |
| filePath | string | File Path | 500 chars max | Yes | Server file path | "/uploads/attachments/2024/01/design-mockup.pdf" |
| fileSize | number | Integer | 8 bytes | Yes | File size in bytes | 2048576 |
| mimeType | string | MIME Type | 100 chars max | Yes | File MIME type | "application/pdf" |
| uploadedAt | timestamp | ISO 8601 | 24 chars | Yes | Upload timestamp | "2024-01-15T10:30:00.000Z" |

**Relationships**:
- Many-to-one with Task

---

### 8. TaskTimeLog
**Collection**: `taskTimeLogs`  
**Description**: Time tracking entries for tasks

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique time log identifier | "550e8400-e29b-41d4-a716-446655440007" |
| taskId | string | UUID v4 | 36 chars | Yes | Parent task ID | "550e8400-e29b-41d4-a716-446655440003" |
| userId | string | Firebase UID | 28 chars | Yes | User who logged time | "abc123def456ghi789jkl012mno" |
| description | string | Text | 500 chars max | No | Time log description | "Implemented login form" |
| startTime | timestamp | ISO 8601 | 24 chars | Yes | Time tracking start | "2024-01-15T09:00:00.000Z" |
| endTime | timestamp | ISO 8601 | 24 chars | No | Time tracking end | "2024-01-15T17:00:00.000Z" |
| duration | number | Integer | 4 bytes | No | Duration in seconds | 28800 |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Task
- Many-to-one with User

---

### 9. TaskDependency
**Collection**: `taskDependencies`  
**Description**: Dependencies between tasks

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique dependency identifier | "550e8400-e29b-41d4-a716-446655440008" |
| taskId | string | UUID v4 | 36 chars | Yes | Task that depends on another | "550e8400-e29b-41d4-a716-446655440003" |
| dependencyId | string | UUID v4 | 36 chars | Yes | ID of the task this depends on | "550e8400-e29b-41d4-a716-446655440009" |
| dependencyType | enum | String | 15 chars | Yes | 'blocks', 'blocked-by', 'related' | "blocked-by" |
| description | string | Text | 500 chars max | No | Dependency description | "Task A must complete before Task B" |
| creatorId | string | Firebase UID | 28 chars | Yes | User who created the dependency | "abc123def456ghi789jkl012mno" |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Creation timestamp | "2024-01-15T10:30:00.000Z" |

**Relationships**:
- Many-to-one with Task (taskId)
- Many-to-one with Task (dependencyId)

---

### 10. TaskSubtask
**Collection**: `taskSubtasks`  
**Description**: Subtasks within tasks

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique subtask identifier | "550e8400-e29b-41d4-a716-446655440010" |
| taskId | string | UUID v4 | 36 chars | Yes | Parent task ID | "550e8400-e29b-41d4-a716-446655440003" |
| title | string | Text | 200 chars max | Yes | Subtask title | "Create login form" |
| description | string | Text | 1000 chars max | No | Subtask description | "Design and implement login form UI" |
| completed | boolean | Boolean | 1 bit | Yes | Completion status | false |
| creatorId | string | Firebase UID | 28 chars | Yes | User who created the subtask | "abc123def456ghi789jkl012mno" |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Task

---

### 11. TaskActivityLog
**Collection**: `taskActivityLogs`  
**Description**: Audit trail of task activities

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique activity log identifier | "550e8400-e29b-41d4-a716-446655440011" |
| taskId | string | UUID v4 | 36 chars | Yes | Related task ID | "550e8400-e29b-41d4-a716-446655440003" |
| userId | string | Firebase UID | 28 chars | Yes | User who performed the action | "abc123def456ghi789jkl012mno" |
| action | string | Text | 50 chars max | Yes | Action performed (e.g., 'created', 'updated', 'assigned') | "status_changed" |
| details | object | JSON Object | Variable | No | Additional action details | {"from": "todo", "to": "in-progress"} |
| timestamp | timestamp | ISO 8601 | 24 chars | Yes | When the action occurred | "2024-01-15T10:30:00.000Z" |

**Relationships**:
- Many-to-one with Task
- Many-to-one with User

---

## Facility Management Models

### 12. FacilityInvitation
**Collection**: `facilityInvitations`  
**Description**: Invitations to join facilities

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique invitation identifier | "550e8400-e29b-41d4-a716-446655440012" |
| facilityId | string | UUID v4 | 36 chars | Yes | Target facility ID | "550e8400-e29b-41d4-a716-446655440000" |
| inviterUserId | string | Firebase UID | 28 chars | Yes | User who sent the invitation | "abc123def456ghi789jkl012mno" |
| inviteeEmail | string | Email format | 254 chars max | Yes | Email of invited user | "newuser@company.com" |
| role | enum | String | 10 chars | Yes | 'admin', 'member', 'guest' | "member" |
| invitationToken | string | Hex string | 64 chars | Yes | Secure invitation token | "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456" |
| status | enum | String | 15 chars | Yes | 'pending', 'accepted', 'rejected', 'expired', 'cancelled' | "pending" |
| expiresAt | timestamp | ISO 8601 | 24 chars | Yes | Invitation expiration | "2024-01-22T10:30:00.000Z" |
| acceptedBy | string | Firebase UID | 28 chars | No | User ID who accepted | "def456ghi789jkl012mno345pqr" |
| acceptedAt | timestamp | ISO 8601 | 24 chars | No | Acceptance timestamp | "2024-01-16T14:20:00.000Z" |
| rejectedAt | timestamp | ISO 8601 | 24 chars | No | Rejection timestamp | null |
| cancelledAt | timestamp | ISO 8601 | 24 chars | No | Cancellation timestamp | null |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Facility

---

### 13. FacilityShareLink
**Collection**: `facilityShareLinks`  
**Description**: Shareable links for facility access

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique share link identifier | "550e8400-e29b-41d4-a716-446655440013" |
| facilityId | string | UUID v4 | 36 chars | Yes | Target facility ID | "550e8400-e29b-41d4-a716-446655440000" |
| creatorUserId | string | Firebase UID | 28 chars | Yes | User who created the link | "abc123def456ghi789jkl012mno" |
| linkId | string | Hex string | 32 chars | Yes | Public link identifier | "a1b2c3d4e5f678901234567890123456" |
| shareToken | string | Hex string | 64 chars | Yes | Secure share token | "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456" |
| role | enum | String | 10 chars | Yes | 'admin', 'member', 'guest' | "member" |
| isActive | boolean | Boolean | 1 bit | Yes | Whether link is active | true |
| expiresAt | timestamp | ISO 8601 | 24 chars | No | Link expiration (null = no expiration) | "2024-01-22T10:30:00.000Z" |
| usageCount | number | Integer | 4 bytes | Yes | Number of times used | 5 |
| maxUsage | number | Integer | 4 bytes | No | Maximum usage limit (null = unlimited) | 100 |
| lastUsedAt | timestamp | ISO 8601 | 24 chars | No | Last usage timestamp | "2024-01-18T16:30:00.000Z" |
| deactivatedBy | string | Firebase UID | 28 chars | No | User who deactivated | "def456ghi789jkl012mno345pqr" |
| deactivatedAt | timestamp | ISO 8601 | 24 chars | No | Deactivation timestamp | null |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Facility

---

### 14. FacilityJoinRequest
**Collection**: `facilityJoinRequests`  
**Description**: Requests to join facilities

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique request identifier | "550e8400-e29b-41d4-a716-446655440014" |
| facilityId | string | UUID v4 | 36 chars | Yes | Target facility ID | "550e8400-e29b-41d4-a716-446655440000" |
| requestingUserId | string | Firebase UID | 28 chars | Yes | User requesting to join | "abc123def456ghi789jkl012mno" |
| message | string | Text | 500 chars max | No | Request message | "I would like to join this facility" |
| shareToken | string | Hex string | 32 chars | No | Share token if applicable | "a1b2c3d4e5f678901234567890123456" |
| status | enum | String | 15 chars | Yes | 'pending', 'approved', 'rejected' | "pending" |
| approvedBy | string | Firebase UID | 28 chars | No | User who approved | "def456ghi789jkl012mno345pqr" |
| approvedAt | timestamp | ISO 8601 | 24 chars | No | Approval timestamp | "2024-01-16T14:20:00.000Z" |
| rejectedBy | string | Firebase UID | 28 chars | No | User who rejected | null |
| rejectedAt | timestamp | ISO 8601 | 24 chars | No | Rejection timestamp | null |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Facility

---

## Additional Models

### 15. Note
**Collection**: `notes`  
**Description**: General notes within facilities

| Field | Data Type | Data Format | Field Size | Required | Description | Sample Data |
|-------|-----------|-------------|------------|----------|-------------|-------------|
| id | string | UUID v4 | 36 chars | Yes | Unique note identifier | "550e8400-e29b-41d4-a716-446655440015" |
| title | string | Text | 200 chars max | Yes | Note title | "Meeting Notes - Q1 Planning" |
| content | string | Text | 10000 chars max | Yes | Note content | "Discussed project priorities and timelines..." |
| facilityId | string | UUID v4 | 36 chars | Yes | Parent facility ID | "550e8400-e29b-41d4-a716-446655440000" |
| userId | string | Firebase UID | 28 chars | Yes | Note creator's user ID | "abc123def456ghi789jkl012mno" |
| createdAt | timestamp | ISO 8601 | 24 chars | Yes | Creation timestamp | "2024-01-15T10:30:00.000Z" |
| updatedAt | timestamp | ISO 8601 | 24 chars | Yes | Last update timestamp | "2024-01-20T14:45:00.000Z" |

**Relationships**:
- Many-to-one with Facility
- Many-to-one with User

---

## Client-Side Data Types

### TypeScript Interfaces with Field Specifications

#### Task Interface (Client)
```typescript
interface Task {
  id: string;                    // UUID v4, 36 chars
  title: string;                 // Text, 200 chars max
  description?: string;          // Text, 2000 chars max
  status: 'todo' | 'in-progress' | 'review' | 'done';  // Enum, 15 chars max
  assignee?: string;             // Firebase UID, 28 chars (legacy)
  assigneeName?: string;         // Text, 100 chars max
  assigneeIds?: string[];        // Array of Firebase UIDs
  priority?: 'low' | 'medium' | 'high' | 'urgent';  // Enum, 10 chars max
  dueDate?: string;              // ISO 8601 Date, 10 chars
  projectId: string;             // UUID v4, 36 chars
  creatorId: string;             // Firebase UID, 28 chars
  createdAt: any;                // ISO 8601 Timestamp, 24 chars
  updatedAt: any;                // ISO 8601 Timestamp, 24 chars
  startDate?: string;            // ISO 8601 Date, 10 chars
  estimatedDuration?: number;    // Integer, 4 bytes (hours)
  actualCompletionDate?: string; // ISO 8601 Date, 10 chars
  progress?: number;             // Integer, 1 byte (0-100)
  tags?: string[];               // Array of strings, 50 chars max each
  pinned?: boolean;              // Boolean, 1 bit
}
```

#### Project Interface (Client)
```typescript
interface Project {
  id: string;                    // UUID v4, 36 chars
  name: string;                  // Text, 100 chars max
  description?: string;          // Text, 1000 chars max
  facilityId: string;            // UUID v4, 36 chars
  creatorId: string;             // Firebase UID, 28 chars
  assignees: string[];           // Array of Firebase UIDs
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'critical';  // Enum, 15 chars max
  archived: boolean;             // Boolean, 1 bit
  createdAt: string;             // ISO 8601 Timestamp, 24 chars
  updatedAt: string;             // ISO 8601 Timestamp, 24 chars
}
```

#### Facility Interface (Client)
```typescript
interface Facility {
  id: string;                    // UUID v4, 36 chars
  name: string;                  // Text, 100 chars max
  description?: string;          // Text, 500 chars max
  status: 'active' | 'inactive' | 'archived';  // Enum, 10 chars max
  ownerId: string;               // Firebase UID, 28 chars
  createdAt: string;             // ISO 8601 Timestamp, 24 chars
  updatedAt: string;             // ISO 8601 Timestamp, 24 chars
  memberCount?: number;          // Integer, 4 bytes
  projectCount?: number;         // Integer, 4 bytes
  taskCount?: number;            // Integer, 4 bytes
}
```

#### TimeLogEntry Interface (Client)
```typescript
interface TimeLogEntry {
  id: string;                    // UUID v4, 36 chars
  taskId: string;                // UUID v4, 36 chars
  taskTitle?: string;            // Text, 200 chars max
  projectId?: string;            // UUID v4, 36 chars
  projectName?: string;          // Text, 100 chars max
  description?: string;          // Text, 500 chars max
  startTime: string;             // ISO 8601 Timestamp, 24 chars
  endTime?: string;              // ISO 8601 Timestamp, 24 chars
  duration?: number;             // Integer, 4 bytes (seconds)
  userId: string;                // Firebase UID, 28 chars
  userName?: string;             // Text, 100 chars max
  createdAt: string;             // ISO 8601 Timestamp, 24 chars
  updatedAt: string;             // ISO 8601 Timestamp, 24 chars
}
```

---

## Enums and Constants

### Task Status
- `todo`: Task is not started
- `in-progress`: Task is being worked on
- `review`: Task is under review
- `done`: Task is completed

### Project Status
- `planning`: Project is in planning phase
- `in-progress`: Project is active
- `completed`: Project is finished
- `on-hold`: Project is paused
- `critical`: Project requires urgent attention

### Priority Levels
- `low`: Low priority
- `medium`: Medium priority (default)
- `high`: High priority
- `urgent`: Urgent priority

### User Roles
- `owner`: Facility owner with full access
- `admin`: Administrative access
- `member`: Standard member access
- `guest`: Limited access

### Facility Status
- `active`: Facility is operational
- `inactive`: Facility is temporarily disabled
- `archived`: Facility is archived

### Invitation Status
- `pending`: Invitation sent, awaiting response
- `accepted`: Invitation accepted
- `rejected`: Invitation rejected
- `expired`: Invitation expired
- `cancelled`: Invitation cancelled

### Dependency Types
- `blocks`: This task blocks the dependent task
- `blocked-by`: This task is blocked by the dependent task
- `related`: Tasks are related but no blocking relationship

---

## Data Relationships Summary

```
User (1) ←→ (M) UserFacility (M) ←→ (1) Facility
Facility (1) ←→ (M) Project
Project (1) ←→ (M) Task
Task (1) ←→ (M) TaskComment
Task (1) ←→ (M) TaskAttachment
Task (1) ←→ (M) TaskTimeLog
Task (1) ←→ (M) TaskDependency
Task (1) ←→ (M) TaskSubtask
Task (1) ←→ (M) TaskActivityLog
Facility (1) ←→ (M) FacilityInvitation
Facility (1) ←→ (M) FacilityShareLink
Facility (1) ←→ (M) FacilityJoinRequest
Facility (1) ←→ (M) Note
```

---

## Data Validation Rules

### User
- Email must be valid format
- First name and last name are required
- Profile picture must be valid URL if provided

### Facility
- Name is required and must be unique within user's facilities
- Status must be one of the defined enum values
- Owner must be a valid user

### Project
- Name is required
- Must belong to a valid facility
- Status must be one of the defined enum values
- Assignees must be valid user IDs

### Task
- Title is required
- Status must be one of the defined enum values
- Priority must be one of the defined enum values
- Due date must be valid ISO string if provided
- Progress must be between 0 and 100
- Must belong to a valid project

### Time Logs
- Start time is required
- End time must be after start time if provided
- Duration must be positive if provided

---

## Indexing Strategy

### Firestore Indexes
- **Users**: email (unique)
- **Facilities**: ownerId, status
- **Projects**: facilityId, creatorId, status
- **Tasks**: projectId, assigneeIds, status, priority, dueDate
- **TaskComments**: taskId, createdAt
- **TaskTimeLogs**: taskId, userId, startTime
- **UserFacilities**: userId, facilityId

### Query Optimization
- Use composite indexes for complex queries
- Implement caching for frequently accessed data
- Use pagination for large result sets
- Optimize real-time listeners for comments

---

## Security Rules

### Firestore Security
- Users can only access facilities they belong to
- Task access is controlled through project membership
- Comments are publicly readable within task context
- Attachments require task access permissions

### Data Privacy
- User emails are only visible to facility members
- Profile pictures are publicly accessible
- Activity logs are only visible to facility members
- Time logs are private to the user and facility admins

---

## Field Specifications Summary

### Data Type Standards

| Data Type | Format | Size | Example | Notes |
|-----------|--------|------|---------|-------|
| **String Types** |
| Firebase UID | Alphanumeric | 28 chars | "abc123def456ghi789jkl012mno" | Firebase user identifier |
| UUID v4 | UUID format | 36 chars | "550e8400-e29b-41d4-a716-446655440000" | Standard UUID format |
| Email | Email format | 254 chars max | "user@company.com" | RFC 5322 compliant |
| Text | Plain text | Variable | "Sample text" | UTF-8 encoded |
| URL | URL format | 500 chars max | "https://example.com/path" | Valid URL format |
| File Path | Path format | 500 chars max | "/uploads/2024/file.pdf" | Server file path |
| MIME Type | MIME format | 100 chars max | "application/pdf" | Standard MIME type |
| Hex String | Hexadecimal | Variable | "a1b2c3d4e5f6" | Lowercase hex |
| **Numeric Types** |
| Integer | Whole number | 1-8 bytes | 42 | Signed integer |
| Boolean | True/False | 1 bit | true | Binary value |
| **Date/Time Types** |
| ISO 8601 Date | YYYY-MM-DD | 10 chars | "2024-01-15" | Date only |
| ISO 8601 Timestamp | Full timestamp | 24 chars | "2024-01-15T10:30:00.000Z" | With timezone |
| **Array Types** |
| String Array | Array of strings | Variable | ["item1", "item2"] | JSON array format |
| **Object Types** |
| JSON Object | JSON format | Variable | {"key": "value"} | Valid JSON structure |

### Field Size Constraints

| Field Category | Max Size | Examples |
|----------------|----------|----------|
| **Identifiers** |
| Firebase UID | 28 chars | User IDs, Creator IDs |
| UUID v4 | 36 chars | Entity IDs, Foreign Keys |
| **Text Fields** |
| Short Text | 50 chars | First Name, Last Name |
| Medium Text | 100-200 chars | Titles, Names |
| Long Text | 500-2000 chars | Descriptions, Content |
| Very Long Text | 10000 chars | Note Content |
| **Special Fields** |
| Email | 254 chars | RFC 5322 standard |
| URL | 500 chars | Profile pictures, links |
| File Path | 500 chars | Attachment paths |
| **Numeric Ranges** |
| Progress | 0-100 | Percentage values |
| Duration | 0-999999 | Seconds or hours |
| File Size | 0-999999999 | Bytes |

### Validation Rules

| Field Type | Validation Rules |
|------------|------------------|
| **Email** | Must match RFC 5322 email format |
| **URL** | Must be valid URL format |
| **UUID** | Must be valid UUID v4 format |
| **Firebase UID** | Must be valid Firebase UID format |
| **Date** | Must be valid ISO 8601 date format |
| **Timestamp** | Must be valid ISO 8601 timestamp format |
| **Progress** | Must be integer between 0 and 100 |
| **Priority** | Must be one of: low, medium, high, urgent |
| **Status** | Must be one of defined enum values |
| **Role** | Must be one of: owner, admin, member, guest |

### Sample Data Patterns

| Field Type | Sample Pattern | Example |
|------------|----------------|---------|
| **User Data** |
| Email | user@domain.com | "john.doe@company.com" |
| Name | First Last | "John Doe" |
| **Entity Data** |
| Title | Descriptive text | "Implement user authentication" |
| Description | Detailed text | "Add login/logout functionality with validation" |
| **Status Data** |
| Task Status | todo, in-progress, review, done | "in-progress" |
| Project Status | planning, in-progress, completed, on-hold, critical | "in-progress" |
| **Time Data** |
| Date | YYYY-MM-DD | "2024-01-15" |
| Timestamp | ISO 8601 | "2024-01-15T10:30:00.000Z" |
| **File Data** |
| File Name | name.extension | "design-mockup.pdf" |
| MIME Type | type/subtype | "application/pdf" |

---

*This data dictionary is maintained as part of the PMS Nexora system documentation and should be updated when data models change.*
