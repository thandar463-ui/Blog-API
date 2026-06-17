import { Router } from "express";
import * as blogController from "./blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";


const router = Router();


router.post("/create", authMiddleware, upload.single("coverImage"), blogController.createBlog);
router.patch("/publish/:id", authMiddleware, blogController.publishBlog);
router.post("/list", blogController.blogList);

export { router as blogRoutes };