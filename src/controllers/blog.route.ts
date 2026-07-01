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
router.post("/ownBlog", authMiddleware, blogController.ownBlogList);

router.post("/save/:id", authMiddleware, blogController.saveBlog);

router.delete("/remove/:id", authMiddleware, blogController.removeSavedBlog);

router.get("/saved/list", authMiddleware, blogController.getSavedBlog);

router.post("/like/:id", authMiddleware, blogController.likeBlog);

router.delete("/unlike/:id", authMiddleware, blogController.unlikedBlog);


router.post("/comments", authMiddleware, blogController.createComment);

router.post("/replies", authMiddleware, blogController.createReply);

router.get("/:id/comments", blogController.commentList);

router.get("/:id/comments/:commentId", blogController.replyList);

router.post("/:id/view", authMiddleware, blogController.viewBlog);

router.get("/:id/stats", authMiddleware, blogController.getBlogStats);

router.post("/:id/read", authMiddleware, blogController.readBlog);

router.post("/:id/stats/engagement", authMiddleware, blogController.getBlogEnagement);

router.post("/categorieslist", blogController.getBlogCategoryList);

router.post("/search", authMiddleware, blogController.searchBlogs);

export { router as blogRoutes };