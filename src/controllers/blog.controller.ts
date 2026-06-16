import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { CreateBlogApiDto } from "../dtos/create-blog-api.dto";
import { BlogListDto } from "../dtos/blog-list.dto";
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

export async function publishBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }

        const blogId = req.params.id;

        if (!blogId) {
            return res.status(400).json({
                message: "Blog id is required",
            });
        }

        const blog = await blogService.publishBlog(blogId as string, req.user.id);
        return res.status(200).json({
            message:
                "Blog published successfully",
            data: blog,
        });
    } catch (err) {
        next(err);
    }
}

export async function blogList(req: Request, res: Response, next: NextFunction) {
    try {
        const input = BlogListDto.parse(req.body);
        const result = await blogService.blogList(input);

        return res.status(200).json({
            message: "Blogs feteched successfully",
            data: result,
        });
    } catch (err) {
        next(err);
    }
}