import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

import { ApiError } from "./api-error";
import { handleErrors } from "./handle-error";
import * as categoryService from "../model/category.service";
export async function getCategoryList(
    req: Request,
    res: Response,
) {
    const categories =
        await categoryService.getCategoryList();

    return res.status(200).json({
        message: "Categories fetched successfully",
        data: categories,
    });
}
