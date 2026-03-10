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
