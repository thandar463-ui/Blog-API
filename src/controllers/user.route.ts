import { Router } from "express";
import * as userController from "./user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/refresh", userController.refreshToken);
router.get("/me", authMiddleware, userController.getMe);

export { router as userRoutes };