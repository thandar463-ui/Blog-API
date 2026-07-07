import { Router } from "express";
import * as adminController from "./admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();


router.post("/login", adminController.login);
;

export { router as adminRoutes };