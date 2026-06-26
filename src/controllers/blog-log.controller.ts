import { Request, Response, NextFunction } from 'express';
import { CreateBlogApiDto } from '../dtos/create-blog-api.dto';
import { ApiError } from "./api-error";

import * as blogLogService from "../model/blog-log.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { logger } from "../lib/logger";

export async function createBlog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {

    try {
        const authorId = req.user?.id;

        if (!authorId) {
            logger.warn({
                type: "unauthorized-create-blog",
                ip: req.ip,
            });

            return res.status(401).json({
                success: false,
                message: "Unauthorized! Author ID not found in request.",
            });
        }

        if (typeof req.body.categoryIds === "string") {
            req.body.categoryIds = [req.body.categoryIds];
        }

        const input = CreateBlogApiDto.parse(req.body);

        const coverImage = req.file?.filename;

        logger.info({
            type: "create-blog-request",
            authorId,
            title: input.title,
            status: input.status,
        });

        const newBlog = await blogLogService.createBlog(
            authorId,
            input,
            coverImage
        );

        logger.info({
            type: "create-blog-response",
            blogId: newBlog.id,
            authorId,
        });

        return res.status(201).json({
            success: true,
            data: newBlog,
            message: "Blog post created successfully!",
        });

    } catch (err: any) {

        next(err);
    }
}