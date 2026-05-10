import { Request, Response } from "express";

export const sendfriendRequestController = (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId;
    const { receiverId } = req.body;

    const result = 0;
    return res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

