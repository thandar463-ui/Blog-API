import { Router } from "express";
import * as blogController from "./blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";


const router = Router();


router.post("/create", authMiddleware, upload.single("coverImage"), blogController.createBlog);
router.patch("/publish/:id", authMiddleware, blogController.publishBlog);
router.post("/list", blogController.blogList);
router.patch("/:id", authMiddleware, upload.single("coverImage"), blogController.updateBlog);
router.delete("/:id", authMiddleware, blogController.deleteBlog);
router.get("/:id", blogController.getBlogDetail);

export { router as blogRoutes };