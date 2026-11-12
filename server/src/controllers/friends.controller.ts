import { Request, Response } from "express";
import {
  acceptFriendRequestService,
  cancelFriendRequestService,
  getFriendsService,
  getRequestsService,
  rejectFriendRequestService,
  removeFriendService,
  searchUsersService,
  sendFriendRequestService,
} from "../services/friends.service";

// общий обработчик: проверка авторизации + единый формат ошибок
const handle =
  (fn: (userId: number, req: Request) => Promise<unknown>, successStatus = 200) =>
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Необходима авторизация" });
      }

      const result = await fn(userId, req);
      return res.status(successStatus).json(result);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

export const searchUsersController = handle((userId, req) =>
  searchUsersService(userId, req.query.q),
);

export const getFriendsController = handle((userId) => getFriendsService(userId));

export const getRequestsController = handle((userId) => getRequestsService(userId));

export const sendFriendRequestController = handle(
  (userId, req) => sendFriendRequestService(userId, req.body?.receiverId),
  201,
);

export const acceptFriendRequestController = handle((userId, req) =>
  acceptFriendRequestService(userId, req.params.requestId),
);

export const rejectFriendRequestController = handle((userId, req) =>
  rejectFriendRequestService(userId, req.params.requestId),
);

export const cancelFriendRequestController = handle((userId, req) =>
  cancelFriendRequestService(userId, req.params.requestId),
);

export const removeFriendController = handle((userId, req) =>
  removeFriendService(userId, req.params.friendId),
);
