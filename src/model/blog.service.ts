import { prisma } from "../lib/prisma";
import { User, Blog, Like } from "../../generated/prisma/client";
import { ApiError } from "../controllers/api-error";
import { CreateBlogApiInput } from "../dtos/create-blog-api.dto";
import { BlogListInput } from "../dtos/blog-list.dto";
import { UpdateBlogInput } from "../dtos/update-blog.dto";
import { CreateCommentApiInput } from "../dtos/create_comment-api.dto";
import { CreateReplyApiInput } from "../dtos/create_reply-api.dto";

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
                _count: {
                    select: {
                        likes: true,
                    },
                },


            },
        }),

        prisma.blog.count({
            where: {
                status: "PUBLISHED",
                deletedAt: null,
                authorId: {
                    not: authorId,
                }
            },
        }),

    ]);

    return {
        blogs: blogs.map((blog) => ({
            ...blog,
            likeCount: blog._count.likes,
        })),
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

export async function getBlogDetail(blogId: string) {
    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
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

            _count: {
                select: {
                    likes: true,
                },
            },


        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    return {
        ...blog,
        likeCount: blog._count.likes,
    };
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
                },

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
                blog: {
                    status: "PUBLISHED",
                    deletedAt: null,
                },

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

export async function likeBlog(userId: string, blogId: string): Promise<Like> {
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

    const existing = await prisma.like.findUnique({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            },
        },
    });

    if (existing) {
        throw new ApiError("Blog already liked", 400);
    }

    const likedBlog = await prisma.like.create({
        data: {
            userId,
            blogId
        },

    });

    return likedBlog;
}


export async function unlikedBlog(userId: string, blogId: string) {

    if (!userId) {
        throw new ApiError("Author not found", 400);
    }
    const existing = await prisma.like.findUnique({
        where: {
            userId_blogId: {
                userId,
                blogId,
            },
        },
    });

    if (!existing) {
        throw new ApiError("Liked blog not found", 404);

    }
    const unlike = await prisma.like.delete({
        where: {
            userId_blogId: {
                userId,
                blogId,
            },
        },

    });

    return unlike;
}

export async function createComment(userId: string, input: CreateCommentApiInput) {

    if (!userId) {
        throw new ApiError("Author not found", 400);
    }

    const blog = await prisma.blog.findFirst({
        where: {
            id: input.blogId,

            status: "PUBLISHED",
            deletedAt: null,

        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    const comment = await prisma.comment.create({
        data: {
            content: input.content,
            userId,
            blogId: input.blogId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return comment;
}

export async function createReply(userId: string, input: CreateReplyApiInput) {
    if (!userId) {
        throw new ApiError("Author not found", 400);
    }

    const comment = await prisma.comment.findUnique({
        where: {
            id: input.commentId,
            deletedAt: null,
            blog: {
                status: "PUBLISHED",
                deletedAt: null,
            },
        },
    });

    if (!comment) {
        throw new ApiError("Comment not found", 404);
    }

    const reply = await prisma.reply.create({
        data: {
            content: input.content,
            userId,
            commentId: input.commentId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                },
            },
        },
    });

    return reply;
}


export async function commentList(blogId: string, input: BlogListInput) {

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

    const skip = (input.page - 1) * input.size;

    const [comments, total] = await Promise.all([
        prisma.comment.findMany({
            where: {
                blogId,
                deletedAt: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        replies: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: input.size,
        }),

        prisma.comment.count({
            where: {
                blogId,
                deletedAt: null,

            },
        }),
    ]);

    return {
        comments: comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,

            user: {
                id: comment.user.id,
                firstName: comment.user.firstName,
                lastName: comment.user.lastName,
            },

            replyCount: comment._count.replies,
        })),

        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        },
    };
}

export async function replyList(blogId: string, commentId: string, input: BlogListInput) {

    const comment = await prisma.comment.findFirst({
        where: {
            id: commentId,
            blogId,
            deletedAt: null,

        },
    });

    if (!comment) {
        throw new ApiError("Comment not found", 404);
    }


    const skip = (input.page - 1) * input.size;

    const [replies, total] = await Promise.all([
        prisma.reply.findMany({
            where: {
                commentId,
                deletedAt: null,

            },
            skip,
            take: input.size,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,

                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },


        }),

        prisma.reply.count({
            where: {
                commentId,
                deletedAt: null,

            },
        }),
    ]);

    return {
        replies: replies.map((reply) => ({
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt,

            user: {
                id: reply.user.id,
                firstName: reply.user.firstName,
                lastName: reply.user.lastName,
            },
        })),

        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        },

    };
}