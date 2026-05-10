import { prisma } from "../utils/prisma";

export const findExistingFriend = async (receiverId: number, senderId: number) => {
  return await prisma.friendship.findFirst({
    where: {
      userId: senderId,
      friendId: receiverId,
    }
  })
}