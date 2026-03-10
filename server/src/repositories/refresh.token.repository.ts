import { prisma } from "../utils/prisma";

export const getRefreshToken = async (userId: number) => {
  return await prisma.refreshToken.findFirst({
    where: { userId },
  });
};

export const writeRefreshToken = async (
  tokenHash: string,
  userId: number,
  expiresAt: Date,
) => {
  return await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });
};

export const deleteOldRefreshToken = async (userId: number) => {
  return await prisma.refreshToken.deleteMany({
    where: {
      userId,
    },
  });
};

export const findByHash = async (tokenHash: string) => {
  return await prisma.refreshToken.findFirst({
    where: {
      tokenHash: tokenHash,
    },
  });
};
