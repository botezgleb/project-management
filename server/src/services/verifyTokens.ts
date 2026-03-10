import jwt from "jsonwebtoken";
import "dotenv/config";

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.REFRESH_SECRET_KEY!);
  } catch (error) {
    throw new Error("Недействительный refresh токен");
  }
};
