import type { PublicUser } from "./friends";

export interface TaskBlocker {
  id: number;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  columnId: number;
  position: number;
  createdById: number;
  createdAt: string;
  completed: boolean;
  completedAt: string | null;
  assignees: PublicUser[];
  subtasksTotal: number;
  subtasksDone: number;
  blockedBy: TaskBlocker[];
  isBlocked: boolean;
}

export interface Subtask {
  id: number;
  parentId: number | null;
  title: string;
  completed: boolean;
  position: number;
  assignee: PublicUser | null;
}

export interface TaskLink {
  id: number;
  title: string;
  completed: boolean;
  columnName: string;
}

export interface TaskDetails {
  task: Task;
  subtasks: Subtask[];
  blockedBy: TaskLink[];
  blocking: TaskLink[];
}
