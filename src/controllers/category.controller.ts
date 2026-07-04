import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";


import { ApiError } from "./api-error";
import { handleErrors } from "./handle-error";
import * as categoryService from "../model/category.service";

export async function getCategoryList(req: Request, res: Response): Promise<void | Response> {
    try {

        const categories = await categoryService.getCategoryList();

        return res.status(200).json({
            data: categories,
            message: "Category List fetched successfully...!",
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getReportCategoryList(req: Request, res: Response): Promise<void | Response> {
    try {

        const reportCategoryList = await categoryService.getReportCategoryList();

        return res.status(200).json({
            data: reportCategoryList,
            message: "Report Category List fetched successfully...!",
        });

    } catch (err) {
        handleErrors(res, err);
    }
}