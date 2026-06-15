import { prisma } from "../lib/prisma";
import { User, Blog } from "../../generated/prisma/client";
import { ApiError } from "../controllers/api-error";
import { CreateBlogApiInput } from "../dtos/create-blog-api.dto";

export async function createBlog(authorId: string, input: CreateBlogApiInput) {

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const currentStatus = input.status || 'DRAFT';

    if (currentStatus === "PUBLISHED") {
        await prisma.blog.deleteMany({
            where: {
                authorId: authorId,
                title: input.title,
                content: input.content,
                status: "DRAFT"
            }
        });
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
            status: input.status,

            published: input.status === "PUBLISHED" ? new Date() : null,

        },
    });

    return blog;
}