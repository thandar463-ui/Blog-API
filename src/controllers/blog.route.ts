import { Router } from "express";
import * as blogController from "./blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();


router.post("/create", authMiddleware, blogController.createBlog);
router.patch("/publish/:id", authMiddleware, blogController.publishBlog);

export { router as blogRoutes };