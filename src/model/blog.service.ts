import { prisma } from "../lib/prisma";
import { User, Blog } from "../../generated/prisma/client";
import { ApiError } from "../controllers/api-error";
import { CreateBlogApiInput } from "../dtos/create-blog-api.dto";
import { BlogListInput } from "../dtos/blog-list.dto";

export async function createBlog(authorId: string, input: CreateBlogApiInput, coverImage?: string) {

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }


    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const slug = `${randomNumber}-${Date.now()}`;

    const blog = await prisma.blog.create({
        data: {
            authorId,
            title: input.title,
            slug,
            content: input.content,
            excerpt: input.excerpt,
            coverImage,
            status: input.status,

            publishedAt: input.status === "PUBLISHED" ? new Date() : null,

        },
    });

    return blog;
}

export async function publishBlog(blogId: string, authorId: string) {
    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            authorId: authorId,
        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    if (blog.authorId !== authorId) {
        throw new ApiError("You don't have permission to publish this blog", 403);
    }

    if (blog.status === "PUBLISHED") {
        throw new ApiError("Blog already published", 400);
    }

    const updatedBlog =
        await prisma.blog.update({
            where: {
                id: blogId,
            },
            data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
        });

    return updatedBlog;
}



export async function blogList(input: BlogListInput) {
    const skip = (input.page - 1) * input.size;

    const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
            where: {
                status: "PUBLISHED",
            },
            skip,
            take: input.size,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        }),

        prisma.blog.count({
            where: {
                status: "PUBLISHED",
            },
        }),
    ]);

    return {
        blogs,
        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        },
    };
}


