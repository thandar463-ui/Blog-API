import { Router } from "express";
import * as blogController from "./blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

console.log("authMiddleware =", authMiddleware);
console.log("createBlog =", blogController.createBlog);
router.post("/create", authMiddleware, blogController.createBlog);

export { router as blogRoutes };