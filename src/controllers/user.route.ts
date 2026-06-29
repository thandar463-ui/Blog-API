import { Router } from "express";
import * as userController from "./user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/refresh", userController.refreshToken);
router.get("/me", authMiddleware, userController.getMe);
router.post("/search", authMiddleware, userController.searchUser);
router.post("/:id/follow", authMiddleware, userController.followUser);
router.delete("/:id/unfollow", authMiddleware, userController.unfollowUser);
router.get("/:id/followers", authMiddleware, userController.getFollowersList);
router.get("/:id/following", authMiddleware, userController.getFollowingList);

export { router as userRoutes };