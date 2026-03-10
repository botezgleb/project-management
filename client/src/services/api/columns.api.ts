import api from "./api";

export const createColumnApi = async (projectId: number, name: string) => {
  const response = await api.post(`/projects/${projectId}/column`, { name });

  return response.data;
};

export const getColumnsApi = async (projectId: number) => {
  const response = await api.get(`/projects/${projectId}/columns`);
  
  return response.data || [];
};

export const updateColumnApi = async (
  projectId: number,
  columnId: number,
  name: string,
) => {
  const response = await api.patch(
    `/projects/${projectId}/column/${columnId}`,
    { name },
  );

  return response.data;
};

export const deleteColumnApi = async (projectId: number, columnId: number) => {
  const response = await api.delete(`/projects/${projectId}/column/${columnId}`);

  return response.data;
};

export const reorderColumnsApi = async (projectId: number, columns: object) => {
  const response = await api.patch(`/projects/${projectId}/columns/reorder`, { columns });

  return response.data;
}