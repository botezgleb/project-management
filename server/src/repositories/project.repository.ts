import { prisma } from "../utils/prisma";
import { ProjectRole } from "@prisma/client";
import { UpdateProjectData } from "../types/consts";

export const createProject = async (
  name: string,
  description: string,
  ownerId: number,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        description,
      },
    });

    const projectMember = await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: ownerId,
        role: ProjectRole.OWNER,
      },
    });

    return {
      ...project,
      members: [projectMember],
    };
  });

  return result;
};

export const getProjectsByUserId = async (userId: number) => {
  const projects = await prisma.project.findMany({
    where: {
      projectMembers: {
        some: {
          userId,
        },
      },
    },
    include: {
      projectMembers: {
        select: {
          role: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          projectMembers: true,
        },
      },
    },
  });

  return projects;
};

export const getOneProjectByUserId = async (
  userId: number,
  projectId: number,
) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      projectMembers: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      projectMembers: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  return project;
};

export const deleteProject = async (projectId: number) => {
  const deleteProject = await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  return deleteProject;
};

export const updateProject = async (
  projectId: number,
  data: UpdateProjectData,
) => {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  const updateProject = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: updateData,
  });

  return updateProject;
};
