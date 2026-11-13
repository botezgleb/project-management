import api from "./api";
import type { Task, TaskDetails, Subtask } from "../../types/task";
import type { Column } from "../../types/column";
import type { MyTasks, ProjectStats } from "../../types/stats";

const base = (projectId: number) => `/projects/${projectId}`;

export const getTaskDetailsApi = async (projectId: number, taskId: number) =>
  (await api.get<TaskDetails>(`${base(projectId)}/tasks/${taskId}`)).data;

export const updateTaskMetaApi = async (
  projectId: number,
  taskId: number,
  data: { completed?: boolean; columnId?: number; assigneeIds?: number[] },
) => (await api.patch<Task>(`${base(projectId)}/tasks/${taskId}`, data)).data;

export const createSubtaskApi = async (
  projectId: number,
  taskId: number,
  title: string,
  parentId?: number | null,
) =>
  (await api.post<Subtask>(`${base(projectId)}/tasks/${taskId}/subtasks`, { title, parentId }))
    .data;

export const updateSubtaskApi = async (
  projectId: number,
  subtaskId: number,
  data: { title?: string; completed?: boolean; assigneeId?: number | null },
) => (await api.patch(`${base(projectId)}/subtasks/${subtaskId}`, data)).data;

export const deleteSubtaskApi = async (projectId: number, subtaskId: number) =>
  (await api.delete(`${base(projectId)}/subtasks/${subtaskId}`)).data;

export const addDependencyApi = async (projectId: number, taskId: number, dependsOnId: number) =>
  (await api.post(`${base(projectId)}/tasks/${taskId}/dependencies`, { dependsOnId })).data;

export const removeDependencyApi = async (
  projectId: number,
  taskId: number,
  dependsOnId: number,
) => (await api.delete(`${base(projectId)}/tasks/${taskId}/dependencies/${dependsOnId}`)).data;

export const updateColumnMetaApi = async (
  projectId: number,
  columnId: number,
  data: { name?: string; isDone?: boolean; responsibleId?: number | null },
) => (await api.patch<Column>(`${base(projectId)}/column/${columnId}`, data)).data;

export const assignAllColumnTasksApi = async (
  projectId: number,
  columnId: number,
  userId?: number,
) =>
  (
    await api.post<{ assigned: number; total: number }>(
      `${base(projectId)}/column/${columnId}/assign-all`,
      userId ? { userId } : {},
    )
  ).data;

export const getProjectStatsApi = async (projectId: number) =>
  (await api.get<ProjectStats>(`${base(projectId)}/stats`)).data;

export const getMyTasksApi = async () => (await api.get<MyTasks>("/users/me/tasks")).data;
