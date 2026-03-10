import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import type { AccessJwtPayload } from "../types/consts";

const accessSecretKey = process.env.ACCESS_SECRET_KEY;

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!accessSecretKey) {
      return res.status(500).json({ message: "JWT секрет не определен" });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ message: "Неверный формат токена"});
    }

    const decoded = jwt.verify(token, accessSecretKey) as AccessJwtPayload;

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Неверный токен" });
  }
};
