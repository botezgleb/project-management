import { createContext } from "react";
import type { ProjectMember } from "../../types/member";
import type { ColumnWithTasks } from "../../types/column";

export interface BoardContextValue {
  projectId: number;
  myId: number | null;
  members: ProjectMember[];
  columns: ColumnWithTasks[];
  onlyMine: boolean;
  reportError: (message: string) => void;
  openTask: (taskId: number) => void;
}

export const BoardContext = createContext<BoardContextValue | null>(null);
