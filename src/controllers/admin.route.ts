import { Router } from "express";
import * as adminController from "./admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();


router.post("/login", adminController.login);

router.patch("/reports/:id/delete-blog", adminMiddleware, adminController.deleteReport);

router.patch("/reports/:id/dismiss", adminMiddleware, adminController.dismissReport);

router.get("/users/:id", adminMiddleware, adminController.getUserDetail);

export { router as adminRoutes };