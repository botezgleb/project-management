import { prisma } from "../utils/prisma";

export const findByEmail = async (email: string) => {
  const emailIsFind = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  return emailIsFind;
};

export const findById = async (userId: number) => {
  return await prisma.user.findFirst({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
};

export const createUser = async (
  email: string,
  password: string,
  name: string,
) => {
  const newUser = await prisma.user.create({
    data: { email, password, name },
  });
  return newUser;
};

export const findByUsername = async (username: string) => {
  return await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
};

export const getUserProfile = async (userId: number) => {
  const [user, ownedProjectsCount, friendships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        projectMembers: {
          select: {
            role: true,
            createdAt: true,
            project: { select: { id: true, name: true, description: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            projectMembers: true,
            createdTasks: true,
            taskAssignees: true,
            receivedFriendRequests: { where: { status: "PENDING" } },
            sentFriendRequests: { where: { status: "PENDING" } },
          },
        },
      },
    }),
    prisma.projectMember.count({ where: { userId, role: "OWNER" } }),
    prisma.friendship.findMany({
      where: { OR: [{ userId }, { friendId: userId }] },
      select: { userId: true, friendId: true },
    }),
  ]);

  if (!user) return null;

  // дружба может храниться в одну или в обе стороны — считаем уникальных собеседников
  const friendIds = new Set(
    friendships.map((f) => (f.userId === userId ? f.friendId : f.userId)),
  );

  return { user, ownedProjectsCount, friendsCount: friendIds.size };
};

export const updateUser = async (
  userId: number,
  data: { name?: string; username?: string | null },
) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true },
  });
};

export const getPublicProfile = async (userId: number, viewerId: number) => {
  const [user, friendships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        // общие проекты: те, где состоит и смотрящий
        projectMembers: {
          where: { project: { projectMembers: { some: { userId: viewerId } } } },
          select: {
            role: true,
            createdAt: true,
            project: { select: { id: true, name: true, description: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            projectMembers: true,
            createdTasks: true,
            taskAssignees: true,
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: { OR: [{ userId }, { friendId: userId }] },
      select: { userId: true, friendId: true },
    }),
  ]);

  if (!user) return null;

  const friendIds = new Set(
    friendships.map((f) => (f.userId === userId ? f.friendId : f.userId)),
  );

  return { user, friendsCount: friendIds.size };
};
