import { FriendRequestStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";

export const publicUserSelect = {
  id: true,
  name: true,
  username: true,
} as const;

// Дружба хранится двумя строками (A→B и B→A), чтобы списки читались одним запросом.
export const findFriendship = async (userId: number, friendId: number) => {
  return await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });
};

export const getFriends = async (userId: number) => {
  return await prisma.friendship.findMany({
    where: { userId },
    select: {
      createdAt: true,
      friend: { select: publicUserSelect },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteFriendship = async (userId: number, friendId: number) => {
  return await prisma.$transaction([
    prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    }),
    // убираем старые заявки, чтобы можно было снова отправить заявку
    prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    }),
  ]);
};

export const findRequestBetween = async (senderId: number, receiverId: number) => {
  return await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId } },
  });
};

export const findRequestById = async (requestId: number) => {
  return await prisma.friendRequest.findUnique({ where: { id: requestId } });
};

export const createRequest = async (senderId: number, receiverId: number) => {
  return await prisma.friendRequest.create({
    data: { senderId, receiverId },
    select: {
      id: true,
      createdAt: true,
      receiver: { select: publicUserSelect },
    },
  });
};

export const resendRequest = async (requestId: number) => {
  return await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FriendRequestStatus.PENDING, createdAt: new Date() },
    select: {
      id: true,
      createdAt: true,
      receiver: { select: publicUserSelect },
    },
  });
};

export const acceptRequest = async (
  requestId: number,
  senderId: number,
  receiverId: number,
) => {
  return await prisma.$transaction([
    prisma.friendRequest.delete({ where: { id: requestId } }),
    // встречная заявка (если обе стороны отправили друг другу) больше не нужна
    prisma.friendRequest.deleteMany({
      where: { senderId: receiverId, receiverId: senderId },
    }),
    prisma.friendship.createMany({
      data: [
        { userId: senderId, friendId: receiverId },
        { userId: receiverId, friendId: senderId },
      ],
      skipDuplicates: true,
    }),
  ]);
};

export const rejectRequest = async (requestId: number) => {
  return await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FriendRequestStatus.REJECTED },
  });
};

export const deleteRequest = async (requestId: number) => {
  return await prisma.friendRequest.delete({ where: { id: requestId } });
};

export const getPendingRequests = async (userId: number) => {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING },
      select: { id: true, createdAt: true, sender: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: userId, status: FriendRequestStatus.PENDING },
      select: { id: true, createdAt: true, receiver: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { incoming, outgoing };
};

export const searchUsersByUsername = async (
  userId: number,
  query: string,
  limit = 20,
) => {
  return await prisma.user.findMany({
    where: {
      id: { not: userId },
      username: { startsWith: query, mode: "insensitive" },
    },
    select: {
      ...publicUserSelect,
      friendshipsAsFriend: { where: { userId }, select: { id: true } },
      receivedFriendRequests: {
        where: { senderId: userId, status: FriendRequestStatus.PENDING },
        select: { id: true },
      },
      sentFriendRequests: {
        where: { receiverId: userId, status: FriendRequestStatus.PENDING },
        select: { id: true },
      },
    },
    orderBy: { username: "asc" },
    take: limit,
  });
};

export const getPublicUser = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
};

export const findPendingBetween = async (userId: number, otherId: number) => {
  return await prisma.friendRequest.findFirst({
    where: {
      status: FriendRequestStatus.PENDING,
      OR: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
    },
  });
};
