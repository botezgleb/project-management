import { prisma } from "../utils/prisma";
import { FriendRequestStatus } from "@prisma/client";

export const sendFriendRequestService = async (senderId: number, receiverId: number) => {
  if (senderId === receiverId) {
    throw new Error("Ошибка. Нельзя добавить самого себя");
  }

  

  const existingFriend = 0
}