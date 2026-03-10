import type { Task } from "./task"

export interface Column {
  id: number;
  name: string;
  projectId: number;
  position: number;
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}