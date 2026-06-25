import { Router } from "express";
import * as categoryController from "./category.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";


const router = Router();



router.get("/list", categoryController.getCategoryList);

export { router as categoryRoutes };