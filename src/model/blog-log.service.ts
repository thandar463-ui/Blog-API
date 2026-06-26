import { Blog } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { ApiError } from "../controllers/api-error";
import { CreateBlogApiInput } from "../dtos/create-blog-api.dto";

export async function createBlog(authorId: string, blogData: CreateBlogApiInput, coverImage?: string): Promise<Blog> {

    if (!authorId) {
        logger.warn({
            type: "create-blog-invalid-author",
        });

        throw new ApiError("Author not found", 400);
    }

    logger.info({
        type: "create-blog-start",
        authorId,
        title: blogData.title,
        status: blogData.status,
        categoryCount: blogData.categoryIds?.length ?? 0,
    });

    try {
        const random4Digit = Math.floor(1000 + Math.random() * 9000);
        const slug = ` ${random4Digit}-${Date.now()}`;

        const newBlog = await prisma.blog.create({
            data: {
                title: blogData.title,
                content: blogData.content,
                excerpt: blogData.excerpt ?? null,
                coverImage,
                status: blogData.status,
                slug,
                authorId,
                publishedAt:
                    blogData.status === "PUBLISHED"
                        ? new Date()
                        : null,

                categories: blogData.categoryIds?.length
                    ? {
                        connect: blogData.categoryIds.map((id) => ({
                            id,
                        })),
                    }
                    : undefined,
            },

            include: {
                categories: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        logger.info({
            type: "create-blog-success",
            blogId: newBlog.id,
            authorId,
            status: newBlog.status,
        });

        return newBlog;
    } catch (error: any) {
        logger.error({
            type: "create-blog-error",
            authorId,
            title: blogData.title,
            message: error.message,
            stack: error.stack,
        });

        throw error;
    }
}