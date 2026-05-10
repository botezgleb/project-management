import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/request", authMiddleware, );

export default router;