import api from "./api";
import type { ProjectMember } from "../../types/member";

export const getProjectMembersApi = async (
  projectId: number,
): Promise<ProjectMember[]> => {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
};

export const addProjectMemberApi = async (
  projectId: number,
  userId: number,
): Promise<ProjectMember[]> => {
  const response = await api.post(`/projects/${projectId}/members`, { userId });
  return response.data;
};

export const removeProjectMemberApi = async (projectId: number, userId: number) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};
