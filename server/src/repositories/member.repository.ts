import { ProjectRole } from "@prisma/client";
import { prisma } from "../utils/prisma";

export const getProjectMembers = async (projectId: number) => {
  return await prisma.projectMember.findMany({
    where: { projectId },
    select: {
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
};

export const findProjectMember = async (projectId: number, userId: number) => {
  return await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
};

export const findProjectBrief = async (projectId: number) => {
  return await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });
};

export const addProjectMember = async (projectId: number, userId: number) => {
  return await prisma.projectMember.create({
    data: { projectId, userId, role: ProjectRole.MEMBER },
  });
};

export const removeProjectMember = async (projectId: number, userId: number) => {
  return await prisma.$transaction([
    // снимаем человека с задач этого проекта
    prisma.taskAssignee.deleteMany({
      where: { userId, task: { column: { projectId } } },
    }),
    prisma.subtask.updateMany({
      where: { assigneeId: userId, task: { column: { projectId } } },
      data: { assigneeId: null },
    }),
    prisma.column.updateMany({
      where: { projectId, responsibleId: userId },
      data: { responsibleId: null },
    }),
    prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);
};
