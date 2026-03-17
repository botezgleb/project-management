import type { Column } from "../../types/column";
import type { Task } from "../../types/task";

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

export type BoardAction =
  | { type: "SET_COLUMNS"; payload: ColumnWithTasks[] }
  | { type: "ADD_COLUMN"; payload: Column }
  | { type: "UPDATE_COLUMN"; payload: { id: number; name: string } }
  | { type: "DELETE_COLUMN"; payload: number }
  | { type: "REORDER_COLUMNS"; payload: Column[] }
  | { type: "ADD_TASK"; payload: { columnId: number; task: Task } }
  | { type: "UPDATE_TASK"; payload: { columnId: number; task: Task } }
  | { type: "DELETE_TASK"; payload: { columnId: number; taskId: number } }
  | { type: "REORDER_TASKS"; payload: { columnId: number; tasks: Task[] } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_ADDING"; payload: boolean }
  | { type: "SET_NEW_COLUMN_NAME"; payload: string }
  | { type: "SET_ACTIVE_TASK"; payload: number | null };

export interface BoardState {
  columns: ColumnWithTasks[];
  loading: boolean;
  error: string | null;
  adding: boolean;
  newColumnName: string;
  activeTaskId: number | null;
}
