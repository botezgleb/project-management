import {
  createProject,
  getProjectsByUserId,
  getOneProjectByUserId,
  deleteProject,
  updateProject,
} from "../repositories/project.repository";
import { UpdateProjectData } from "../types/consts";

export const createProjectService = async (
  name: string,
  description: string,
  ownerId: number,
) => {
  if (!name) {
    throw new Error("Введите название проекта");
  }

  const newProject = await createProject(name, description, ownerId);

  return {
    id: newProject.id,
    name: newProject.name,
    description: newProject.description,
    members: newProject.members.map((member) => ({
      userId: member.userId,
      role: member.role,
    })),
  };
};

export const getProjectsService = async (userId: number) => {
  const projects = await getProjectsByUserId(userId);

  return projects.map((project) => {
    const memberShip = project.projectMembers.find(
      (member) => member.userId === userId,
    );

    const owner = project.projectMembers.find(
      (member) => member.role === "OWNER",
    );

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,

      role: memberShip?.role,

      owner: {
        id: owner?.user.id,
        name: owner?.user.name,
      },

      membersCount: project._count.projectMembers,
    };
  });
};

export const getOneProjectService = async (
  userId: number,
  projectId: number,
) => {
  const project = await getOneProjectByUserId(userId, projectId);

  return {
    id: project?.id,
    name: project?.name,
    description: project?.description,
    role: project?.projectMembers[0]?.role,
  };
};

export const deleteProjectService = async (projectId: number) => {
  const deletedProject = await deleteProject(projectId);

  return {
    message: "Проект успешно удален",
    success: true,
    id: deletedProject.id,
    name: deletedProject.name,
  };
};

export const updateProjectService = async (
  projectId: number,
  data: UpdateProjectData,
) => {
  const updatedProject = await updateProject(projectId, data);

  return {
    message: "Проект успешно обновлен",
    success: true,
    id: updatedProject.id,
    name: updatedProject.name,
    description: updatedProject.description,
  };
};
