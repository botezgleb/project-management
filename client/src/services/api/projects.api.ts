import api from "./api";
import type { Project } from "../../types/project";

export const createProjectApi = async (name: string, description: string) => {
  const response = await api.post("/projects", { name, description });

  return response.data;
};

export const getProjectsApi = async (): Promise<Project[]> => {
  const response = await api.get("/projects");

  return response.data;
};

export const getOneProjectApi = async (id: number) => {
  const response = await api.get(`/projects/${id}`);

  return response.data;
};

export const deleteProjectApi = async (id: number) => {
  const response = await api.delete(`/projects/${id}`);

  return response.data;
};

export const updateProjectApi = async (
  id: number,
  data: { name?: string; description?: string },
) => {
  const response = await api.patch(`/projects/${id}`, data);

  return response.data;
};
