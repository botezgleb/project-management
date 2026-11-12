import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getProfileController,
  getPublicProfileController,
  updateProfileController,
} from "../controllers/user.controller";

const router = Router();

router.get("/me", authMiddleware, getProfileController);
router.patch("/me", authMiddleware, updateProfileController);
router.get("/:userId", authMiddleware, getPublicProfileController);

export default router;
