import type { PublicUser } from "./friends";
import type { Task } from "./task";

export interface ProjectStats {
  totals: {
    tasks: number;
    completed: number;
    open: number;
    blocked: number;
    unassigned: number;
    subtasks: number;
    subtasksDone: number;
    completionRate: number;
  };
  byColumn: {
    id: number;
    name: string;
    isDone: boolean;
    responsible: PublicUser | null;
    total: number;
    completed: number;
  }[];
  byMember: {
    user: PublicUser;
    role: "OWNER" | "MEMBER";
    assigned: number;
    completed: number;
    open: number;
    blocked: number;
    subtasksAssigned: number;
    subtasksDone: number;
    responsibleFor: { id: number; name: string }[];
  }[];
  activity: { date: string; completed: number }[];
}

export interface MyTask extends Task {
  column: { id: number; name: string; isDone: boolean };
  project: { id: number; name: string };
}

export interface MyTasks {
  tasks: MyTask[];
  subtasks: {
    id: number;
    title: string;
    completed: boolean;
    task: { id: number; title: string };
    project: { id: number; name: string };
  }[];
}
