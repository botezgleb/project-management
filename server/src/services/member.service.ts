import { Prisma, ProjectRole } from "@prisma/client";
import {
  addProjectMember,
  findProjectBrief,
  findProjectMember,
  getProjectMembers,
  removeProjectMember,
} from "../repositories/member.repository";
import {
  findFriendship,
  getPublicUser,
} from "../repositories/friends.repository";
import { getIO, notifyUser } from "../socket/socket";

const toId = (value: unknown) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Невалидный ID пользователя");
  }
  return id;
};

const emitMembersUpdated = (projectId: number) => {
  try {
    getIO().to(`project-${projectId}`).emit("members-updated", { projectId });
  } catch (error) {
    console.error(error);
  }
};

export const getMembersService = async (projectId: number) => {
  const members = await getProjectMembers(projectId);

  return members.map((m) => ({
    ...m.user,
    role: m.role,
    joinedAt: m.createdAt,
  }));
};

export const addMemberService = async (
  projectId: number,
  ownerId: number,
  rawUserId: unknown,
) => {
  const userId = toId(rawUserId);

  if (userId === ownerId) {
    throw new Error("Вы уже состоите в проекте");
  }

  if (!(await findFriendship(ownerId, userId))) {
    throw new Error("Добавлять в проект можно только коллег");
  }

  if (await findProjectMember(projectId, userId)) {
    throw new Error("Пользователь уже участник проекта");
  }

  try {
    await addProjectMember(projectId, userId);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Пользователь уже участник проекта");
    }
    throw error;
  }

  const [project, by] = await Promise.all([
    findProjectBrief(projectId),
    getPublicUser(ownerId),
  ]);

  emitMembersUpdated(projectId);
  notifyUser(userId, "project:added", { project, by });

  return getMembersService(projectId);
};

export const removeMemberService = async (
  projectId: number,
  requesterId: number,
  requesterRole: ProjectRole | undefined,
  rawUserId: unknown,
) => {
  const userId = toId(rawUserId);
  const isSelf = userId === requesterId;

  const target = await findProjectMember(projectId, userId);
  if (!target) {
    throw new Error("Пользователь не участник проекта");
  }

  if (target.role === ProjectRole.OWNER) {
    throw new Error(
      isSelf
        ? "Владелец не может покинуть проект — его можно только удалить"
        : "Нельзя исключить владельца проекта",
    );
  }

  if (!isSelf && requesterRole !== ProjectRole.OWNER) {
    throw new Error("Исключать участников может только владелец");
  }

  await removeProjectMember(projectId, userId);

  emitMembersUpdated(projectId);

  if (!isSelf) {
    const [project, by] = await Promise.all([
      findProjectBrief(projectId),
      getPublicUser(requesterId),
    ]);
    notifyUser(userId, "project:removed", { project, by });
  }

  return { message: isSelf ? "Вы покинули проект" : "Участник исключён" };
};
