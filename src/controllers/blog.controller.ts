import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { CreateBlogApiDto } from "../dtos/create-blog-api.dto";
import { ApiError } from "./api-error";
import { handleErrors } from "./handle-error";
import * as blogService from "../model/blog.service";

export async function createBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ meaaage: "Unauthorized", });
        }

        const input = CreateBlogApiDto.parse(req.body);
        const blog = await blogService.createBlog(req.user.id, input);

        return res.status(201).json({
            message: "Blog created successfully",
            data: blog,
        });

    } catch (err) {
        next(err);
    }
}