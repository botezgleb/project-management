import bcrypt from "bcrypt";
import * as crypto from "crypto";
import {
  findByEmail,
  createUser,
  findById,
} from "../repositories/user.repository";
import { generateAccessToken, generateRefreshToken } from "./generateTokens";
import {
  deleteOldRefreshToken,
  findByHash,
  getRefreshToken,
  writeRefreshToken,
} from "../repositories/refresh.token.repository";
import "dotenv/config";
import { verifyRefreshToken } from "./verifyTokens";

export const loginService = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Введите email и пароль");
  }

  const user = await findByEmail(email);

  if (!user) {
    throw new Error("Неверный email или пароль");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Неверный email или пароль");
  }

  const accessPayload = { userId: user.id, role: user.role };
  const refreshPayload = { userId: user.id };

  const accessToken = generateAccessToken(accessPayload);
  const refreshToken = generateRefreshToken(refreshPayload);

  const refreshHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const existingToken = await getRefreshToken(user.id);

  if (existingToken) {
    await deleteOldRefreshToken(user.id);
  }

  await writeRefreshToken(refreshHash, user.id, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.name,
      role: user.role,
    },
  };
};

export const registerService = async (
  email: string,
  password: string,
  name: string,
) => {
  if (!email || !password || !name) {
    throw new Error("Введите email, пароль и имя");
  }

  const existingUser = await findByEmail(email);

  if (existingUser) {
    throw new Error("Пользователь с таким email уже существует");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await createUser(email, hashedPassword, name);

  const accessPayload = { userId: newUser.id, role: newUser.role };
  const refreshPayload = { userId: newUser.id };

  const accessToken = generateAccessToken(accessPayload);
  const refreshToken = generateRefreshToken(refreshPayload);

  const refreshHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  await writeRefreshToken(refreshHash, newUser.id, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.name,
      role: newUser.role,
    },
  };
};

export const refreshService = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new Error("Нет refresh токена");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new Error("Refresh токен не действителен");
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const existingToken = await findByHash(tokenHash);

  if (!existingToken) {
    throw new Error("Refresh токен не найден в БД");
  }

  if (existingToken.expiresAt < new Date()) {
    await deleteOldRefreshToken(existingToken.userId);
    throw new Error("Срок действия refresh токена истек");
  }

  const user = await findById(existingToken.userId);

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  const accessPayload = { userId: user.id, role: user.role };
  const refreshPayload = { userId: user.id };

  const newAccessToken = generateAccessToken(accessPayload);
  const newRefreshToken = generateRefreshToken(refreshPayload);

  const newRefreshHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  await deleteOldRefreshToken(user.id);
  await writeRefreshToken(newRefreshHash, user.id, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};
