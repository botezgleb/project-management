import { Request, Response } from "express";
import {
  loginService,
  refreshService,
  registerService,
} from "../services/auth.service";
import { deleteOldRefreshToken } from "../repositories/refresh.token.repository";

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
export const registerController = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await registerService(email, password, name);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const meController = (req: Request, res: Response) => {
  return res.json(req.user);
};

export const refreshController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh токен не предоставлен" });
    }

    const result = await refreshService(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    res.clearCookie("refreshToken");
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json("Не авторизован");
    }

    await deleteOldRefreshToken(userId);
    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json({ message: "Вы успешно вышли из учетной записи!" });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
