import type { Task } from "./task";
import type { PublicUser } from "./friends";

export interface Column {
  id: number;
  name: string;
  projectId: number;
  position: number;
  isDone?: boolean;
  responsibleId?: number | null;
  responsible?: PublicUser | null;
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}
