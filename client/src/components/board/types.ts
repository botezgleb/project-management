import type { Task as TaskType } from "../../types/task";

export interface TaskCardProps {
  task: TaskType;
  columnId: number;
  onDelete: (taskId: number) => Promise<void>;
  onUpdate: (taskId: number, title: string, description: string) => Promise<void>;
  isOverlay?: boolean;
}