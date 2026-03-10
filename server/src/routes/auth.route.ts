import { Router } from "express";
import { loginController, registerController, meController, refreshController, logoutController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.get("/me", authMiddleware, meController);
router.post("/refresh", refreshController);
router.post("/logout", authMiddleware, logoutController);
// router.post("/forgot-password");
// router.post("/reset-password");
// router.post("/change-password");

export default router;
