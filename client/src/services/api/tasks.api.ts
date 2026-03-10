import api from "./api";

export const createTaskApi = async (
  title: string,
  description: string,
  columnId: number,
  projectId: number,
) => {
  return await api.post(`/projects/${projectId}/column/${columnId}`, {
    title,
    description,
  });
};

export const getTasksApi = async (projectId: number, columnId: number) => {
  return await api.get(`/projects/${projectId}/column/${columnId}`);
};

export const updateTaskApi = async (
  title: string,
  description: string,
  projectId: number,
  columnId: number,
  taskId: number,
) => {
  return await api.put(`/projects/${projectId}/column/${columnId}/${taskId}`, {
    title,
    description,
  });
};

export const deleteTaskApi = async (
  projectId: number,
  columnId: number,
  taskId: number,
) => {
  return await api.delete(
    `/projects/${projectId}/column/${columnId}/${taskId}`,
  );
};

export const reorderTaskApi = async (
  projectId: number,
  columnId: number,
  taskId: number,
  newPosition: number,
) => {
  const response = await api.patch(
    `/projects/${projectId}/column/${columnId}/${taskId}`,
    { newPosition },
  );
  return response.data;
};