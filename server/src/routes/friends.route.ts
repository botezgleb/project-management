import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  acceptFriendRequestController,
  cancelFriendRequestController,
  getFriendsController,
  getRequestsController,
  rejectFriendRequestController,
  removeFriendController,
  searchUsersController,
  sendFriendRequestController,
} from "../controllers/friends.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getFriendsController);
router.get("/search", searchUsersController);
router.get("/requests", getRequestsController);
router.post("/requests", sendFriendRequestController);
router.post("/requests/:requestId/accept", acceptFriendRequestController);
router.post("/requests/:requestId/reject", rejectFriendRequestController);
router.delete("/requests/:requestId", cancelFriendRequestController);
router.delete("/:friendId", removeFriendController);

export default router;
