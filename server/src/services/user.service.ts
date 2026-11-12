import { Prisma } from "@prisma/client";
import { getRelationService } from "./friends.service";
import {
  findByUsername,
  getPublicProfile,
  getUserProfile,
  updateUser,
} from "../repositories/user.repository";
import { UpdateProfileData } from "../types/consts";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const getProfileService = async (userId: number) => {
  const result = await getUserProfile(userId);

  if (!result) {
    throw new Error("Пользователь не найден");
  }

  const { user, ownedProjectsCount, friendsCount } = result;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    stats: {
      projects: user._count.projectMembers,
      ownedProjects: ownedProjectsCount,
      createdTasks: user._count.createdTasks,
      assignedTasks: user._count.taskAssignees,
      friends: friendsCount,
      incomingRequests: user._count.receivedFriendRequests,
      outgoingRequests: user._count.sentFriendRequests,
    },
    projects: user.projectMembers.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      role: m.role,
      joinedAt: m.createdAt,
    })),
  };
};

export const updateProfileService = async (
  userId: number,
  data: UpdateProfileData,
) => {
  const updateData: { name?: string; username?: string | null } = {};

  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (name.length < 2 || name.length > 50) {
      throw new Error("Имя должно быть от 2 до 50 символов");
    }
    updateData.name = name;
  }

  if (data.username !== undefined) {
    const username = String(data.username ?? "").trim().toLowerCase();

    if (username === "") {
      updateData.username = null;
    } else {
      if (!USERNAME_REGEX.test(username)) {
        throw new Error(
          "Username: 3–20 символов, только латиница, цифры и подчёркивание",
        );
      }

      const existing = await findByUsername(username);
      if (existing && existing.id !== userId) {
        throw new Error("Этот username уже занят");
      }
      updateData.username = username;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("Нет данных для обновления");
  }

  try {
    await updateUser(userId, updateData);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Этот username уже занят");
    }
    throw error;
  }

  return getProfileService(userId);
};

export const getPublicProfileService = async (
  viewerId: number,
  rawUserId: unknown,
) => {
  const userId = Number(rawUserId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Невалидный ID пользователя");
  }

  const [result, relation] = await Promise.all([
    getPublicProfile(userId, viewerId),
    getRelationService(viewerId, userId),
  ]);

  if (!result) {
    throw new Error("Пользователь не найден");
  }

  const { user, friendsCount } = result;
  const isSelf = viewerId === userId;
  const isFriend = relation.status === "FRIEND";

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    // email видят только коллеги
    email: isSelf || isFriend ? user.email : null,
    isSelf,
    relation: isSelf ? null : relation,
    stats: {
      projects: user._count.projectMembers,
      createdTasks: user._count.createdTasks,
      assignedTasks: user._count.taskAssignees,
      friends: friendsCount,
    },
    mutualProjects: isSelf
      ? []
      : user.projectMembers.map((m) => ({
          id: m.project.id,
          name: m.project.name,
          description: m.project.description,
          role: m.role,
          joinedAt: m.createdAt,
        })),
  };
};
