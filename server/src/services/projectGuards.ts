import { prisma } from "../utils/prisma";

export const toPositiveInt = (value: unknown, label: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Невалидный ${label}`);
  }
  return id;
};

export const assertProjectMember = async (projectId: number, userId: number) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { userId: true },
  });
  if (!member) {
    throw new Error("Пользователь не участник проекта");
  }
};

export const getTaskInProject = async (projectId: number, taskId: number) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, column: { projectId } },
    include: { column: { select: { id: true, isDone: true, projectId: true } } },
  });
  if (!task) {
    throw new Error("Задача не найдена");
  }
  return task;
};

export const getProjectBrief = async (projectId: number) =>
  prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } });
