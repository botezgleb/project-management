export interface Task {
  id: number;
  title: string;
  description?: string | null;
  columnId: number;
  position: number;
  createdById: number;
  createdAt: string;
}
