export interface Note {
  id: string;
  title: string;
  content: string; // Rich text or markdown
  createdAt: string; // Using string for easier serialization if needed, or Date
  reminderDate?: string;
  attachments?: FileAttachment[];
  hyperlinks?: Hyperlink[]; // Array of link objects
  linkedTaskId?: string; // ID of linked task/subtask
}

export interface Hyperlink {
  id: string;
  url: string;
  referenceNumber: number; // or use icon/symbol
  title?: string; // Optional display title
  description?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string; // Cloud storage URL
  size: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  parentTaskId?: string; // For subtask hierarchy
  linkedNoteId?: string; // ID of linked note
  previousSubtaskStates?: Record<string, boolean>; // To restore state on uncheck
}
