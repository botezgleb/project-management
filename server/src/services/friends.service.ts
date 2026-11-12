import { Prisma } from "@prisma/client";
import { findById } from "../repositories/user.repository";
import { notifyUser } from "../socket/socket";
import {
  acceptRequest,
  createRequest,
  deleteFriendship,
  deleteRequest,
  findFriendship,
  findRequestBetween,
  findPendingBetween,
  findRequestById,
  getFriends,
  getPublicUser,
  getPendingRequests,
  rejectRequest,
  resendRequest,
  searchUsersByUsername,
} from "../repositories/friends.repository";

export type RelationStatus = "NONE" | "FRIEND" | "OUTGOING" | "INCOMING";

export type FriendsEventType =
  | "request-received"
  | "request-accepted"
  | "request-rejected"
  | "request-cancelled"
  | "removed";

// сообщаем второй стороне, что у неё изменились коллеги/заявки
const notifyFriendsChanged = async (
  targetUserId: number,
  actorId: number,
  type: FriendsEventType,
) => {
  try {
    const user = await getPublicUser(actorId);
    notifyUser(targetUserId, "friends:changed", { type, user });
  } catch (error) {
    console.error("notifyFriendsChanged failed", error);
  }
};

export const getRelationService = async (
  userId: number,
  otherId: number,
): Promise<{ status: RelationStatus; requestId: number | null }> => {
  if (await findFriendship(userId, otherId)) {
    return { status: "FRIEND", requestId: null };
  }

  const pending = await findPendingBetween(userId, otherId);
  if (!pending) return { status: "NONE", requestId: null };

  return {
    status: pending.senderId === userId ? "OUTGOING" : "INCOMING",
    requestId: pending.id,
  };
};

const toId = (value: unknown, label: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Невалидный ${label}`);
  }
  return id;
};

export const searchUsersService = async (userId: number, rawQuery: unknown) => {
  const query = String(rawQuery ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  if (query.length < 2) {
    throw new Error("Введите минимум 2 символа");
  }

  const users = await searchUsersByUsername(userId, query);

  return users.map((u) => {
    let status: RelationStatus = "NONE";
    let requestId: number | null = null;

    const incoming = u.sentFriendRequests[0];
    const outgoing = u.receivedFriendRequests[0];

    if (u.friendshipsAsFriend.length > 0) {
      status = "FRIEND";
    } else if (incoming) {
      status = "INCOMING";
      requestId = incoming.id;
    } else if (outgoing) {
      status = "OUTGOING";
      requestId = outgoing.id;
    }

    return { id: u.id, name: u.name, username: u.username, status, requestId };
  });
};

export const getFriendsService = async (userId: number) => {
  const friends = await getFriends(userId);
  return friends.map((f) => ({ ...f.friend, since: f.createdAt }));
};

export const getRequestsService = async (userId: number) => {
  const { incoming, outgoing } = await getPendingRequests(userId);
  return {
    incoming: incoming.map((r) => ({ id: r.id, createdAt: r.createdAt, user: r.sender })),
    outgoing: outgoing.map((r) => ({ id: r.id, createdAt: r.createdAt, user: r.receiver })),
  };
};

export const sendFriendRequestService = async (
  senderId: number,
  rawReceiverId: unknown,
) => {
  const receiverId = toId(rawReceiverId, "ID пользователя");

  if (senderId === receiverId) {
    throw new Error("Ошибка. Нельзя добавить самого себя");
  }

  const receiver = await findById(receiverId);
  if (!receiver) {
    throw new Error("Пользователь не найден");
  }

  if (await findFriendship(senderId, receiverId)) {
    throw new Error("Пользователь уже у вас в коллегах");
  }

  // если он уже отправил нам заявку — просто принимаем её
  const reverse = await findRequestBetween(receiverId, senderId);
  if (reverse && reverse.status === "PENDING") {
    await acceptRequest(reverse.id, reverse.senderId, reverse.receiverId);
    await notifyFriendsChanged(receiverId, senderId, "request-accepted");
    return { status: "FRIEND" as RelationStatus, requestId: null };
  }

  const existing = await findRequestBetween(senderId, receiverId);
  if (existing) {
    if (existing.status === "PENDING") {
      throw new Error("Заявка уже отправлена");
    }
    const request = await resendRequest(existing.id);
    await notifyFriendsChanged(receiverId, senderId, "request-received");
    return { status: "OUTGOING" as RelationStatus, requestId: request.id };
  }

  try {
    const request = await createRequest(senderId, receiverId);
    await notifyFriendsChanged(receiverId, senderId, "request-received");
    return { status: "OUTGOING" as RelationStatus, requestId: request.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Заявка уже отправлена");
    }
    throw error;
  }
};

const getIncomingRequest = async (userId: number, rawRequestId: unknown) => {
  const requestId = toId(rawRequestId, "ID заявки");
  const request = await findRequestById(requestId);

  if (!request || request.receiverId !== userId || request.status !== "PENDING") {
    throw new Error("Заявка не найдена");
  }
  return request;
};

export const acceptFriendRequestService = async (
  userId: number,
  rawRequestId: unknown,
) => {
  const request = await getIncomingRequest(userId, rawRequestId);
  await acceptRequest(request.id, request.senderId, request.receiverId);
  await notifyFriendsChanged(request.senderId, userId, "request-accepted");
  return { message: "Заявка принята" };
};

export const rejectFriendRequestService = async (
  userId: number,
  rawRequestId: unknown,
) => {
  const request = await getIncomingRequest(userId, rawRequestId);
  await rejectRequest(request.id);
  await notifyFriendsChanged(request.senderId, userId, "request-rejected");
  return { message: "Заявка отклонена" };
};

export const cancelFriendRequestService = async (
  userId: number,
  rawRequestId: unknown,
) => {
  const requestId = toId(rawRequestId, "ID заявки");
  const request = await findRequestById(requestId);

  if (!request || request.senderId !== userId || request.status !== "PENDING") {
    throw new Error("Заявка не найдена");
  }

  await deleteRequest(request.id);
  await notifyFriendsChanged(request.receiverId, userId, "request-cancelled");
  return { message: "Заявка отменена" };
};

export const removeFriendService = async (userId: number, rawFriendId: unknown) => {
  const friendId = toId(rawFriendId, "ID пользователя");

  if (!(await findFriendship(userId, friendId))) {
    throw new Error("Пользователь не в списке коллег");
  }

  await deleteFriendship(userId, friendId);
  await notifyFriendsChanged(friendId, userId, "removed");
  return { message: "Коллега удалён" };
};
