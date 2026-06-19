import { prisma } from "../lib/prisma";
import { User, Blog } from "../../generated/prisma/client";
import { ApiError } from "../controllers/api-error";
import { CreateBlogApiInput } from "../dtos/create-blog-api.dto";
import { BlogListInput } from "../dtos/blog-list.dto";
import { UpdateBlogInput } from "../dtos/update-blog.dto";

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


    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }
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



export async function blogList(authorId: string, input: BlogListInput) {

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const skip = (input.page - 1) * input.size;

    const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
            where: {
                status: "PUBLISHED",
                deletedAt: null,
                authorId: {
                    not: authorId,
                }
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
                deletedAt: null,
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

export async function updateBlog(blogId: string, authorId: string, input: UpdateBlogInput, coverImage?: string) {


    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            authorId: authorId,

        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }


    if (blog.deletedAt) {
        throw new ApiError("Blog can not be updated", 400);
    }
    const updatedBlog = await prisma.blog.update({
        where: {
            id: blogId,
        },
        data: {
            ...(input.title && {
                title: input.title,
            }),
            ...(input.content && {
                content: input.content,
            }),

            ...(input.excerpt && {
                excerpt: input.excerpt,
            }),

            ...(coverImage && {
                coverImage,
            }),
        },
    });
    return updatedBlog;
}

export async function deleteBlog(blogId: string, authorId: string) {
    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            authorId,
        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    if (blog.deletedAt !== null) {
        throw new ApiError("Blog has already been deleted", 400);
    }

    const deletedBlog = await prisma.blog.update({
        where: {
            id: blogId,
        },
        data: {
            deletedAt: new Date(),
        },
    });

    return deletedBlog;
}

export async function getBlogDetail(bolgId: string) {
    const blog = await prisma.blog.findFirst({
        where: {
            id: bolgId,
            status: "PUBLISHED",
            deletedAt: null,
        },

        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    return blog;
}

export async function saveBlog(userId: string, blogId: string) {
    if (!userId) {
        throw new ApiError("Author not found", 400);
    }

    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            status: "PUBLISHED",
            deletedAt: null,

        },
    });
    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    if (blog.status !== "PUBLISHED") {
        throw new ApiError("Blog has not published", 400);
    }

    if (blog.deletedAt !== null) {
        throw new ApiError("Blog has already been deleted", 400);
    }

    const existing = await prisma.savedBlog.findUnique({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            },
        },
    });

    if (existing) {
        throw new ApiError("Blog already saved", 400);
    }

    const savedBlog = await prisma.savedBlog.create({
        data: {
            userId,
            blogId
        },

    });

    return savedBlog;
}

export async function removeSavedBlog(userId: string, blogId: string) {

    if (!userId) {
        throw new ApiError("Author not found", 400);
    }
    const existing = await prisma.savedBlog.findUnique({
        where: {
            userId_blogId: {
                userId,
                blogId,
            },
        },
    });

    if (!existing) {
        throw new ApiError("Save blog not found", 404);

    }
    await prisma.savedBlog.delete({
        where: {
            userId_blogId: {
                userId,
                blogId,
            },
        },

    });

    return {
        message: "Saved blog removed successfully",
    };
}


export async function getSavedBlog(userId: string, input: BlogListInput) {
    if (!userId) {
        throw new ApiError("User not found", 400);
    }

    const skip = (input.page - 1) * input.size;

    const [savedBlogs, total] = await Promise.all([
        prisma.savedBlog.findMany({
            where: {
                userId: userId,
                blog: {
                    status: "PUBLISHED",
                    deletedAt: null,
                }

            },
            include: {
                blog: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                savedAt: "desc",
            },
            skip,
            take: input.size,
        }),

        prisma.savedBlog.count({
            where: {
                userId: userId,
            },
        }),
    ]);

    return {
        savedBlogs,
        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        },
    };
}


