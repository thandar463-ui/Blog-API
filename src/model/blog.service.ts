import { prisma } from "../lib/prisma";

import { Prisma } from "../../generated/prisma/client";
import { User, Blog, Like } from "../../generated/prisma/client";
import { ApiError } from "../controllers/api-error";
import { CreateBlogApiInput } from "../dtos/create-blog-api.dto";
import { BlogListInput } from "../dtos/blog-list.dto";
import { UpdateBlogInput } from "../dtos/update-blog.dto";
import { CreateCommentApiInput } from "../dtos/create_comment-api.dto";
import { CreateReplyApiInput } from "../dtos/create_reply-api.dto";
import { GetEnagementInput } from "../dtos/get-enagement-dto";
import { GetBlogListCategoryInput } from "../dtos/get-bloglist-by-category.dto";
import { connect } from "node:http2";
import { sendMail } from "./mail.service";
import { SearchUserApiInput } from "../dtos/search-user-api.dto";
import { CursorBlogListInput } from "../dtos/cursor-blog-list.dto";
import { CreateReportInput } from "../dtos/create-report.dto";
import { Cache } from "../lib/cache";
import { ReportListInput } from "../dtos/report-list.dto";
import { ReportInfoListInput } from "../dtos/reportInfo-list.dto";

const cache = Cache.getInstance();

export async function createBlog(authorId: string, input: CreateBlogApiInput, coverImage?: string) {

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
            categories:
                input.categoryIds?.length
                    ? {
                        connect: input.categoryIds.map(id => ({
                            id,
                        })),
                    } : undefined,
        },


        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
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


    if (blog.status === "PUBLISHED") {

        const followers = await prisma.follow.findMany({
            where: {
                followingId: authorId,
                isSubscribed: true,
            },
            select: {
                follower: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        await Promise.all(
            followers.map((follow) =>
                sendMail(
                    follow.follower.email,
                    `${blog.author.firstName} ${blog.author.lastName}`,
                    blog.title,
                    blog.slug
                )
            )
        );
    }
}

export async function publishBlog(blogId: string, authorId: string): Promise<Blog> {

    const existingBlog = await prisma.blog.findUnique({
        where: {
            id: blogId,
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });

    if (!existingBlog) {
        throw new ApiError("Blog not found", 404);
    }

    if (existingBlog.authorId !== authorId) {
        throw new ApiError(
            "You don't have permission to publish this blog",
            403
        );
    }

    if (existingBlog.status === "PUBLISHED") {
        throw new ApiError(
            "This blog has already been published",
            400
        );
    }

    const updatedBlog = await prisma.blog.update({
        where: {
            id: blogId,
        },
        data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
        },
    });

    const followers = await prisma.follow.findMany({
        where: {
            followingId: authorId,
            isSubscribed: true,
        },
        select: {
            follower: {
                select: {
                    email: true,
                },
            },
        },
    });

    await Promise.all(
        followers.map((follow) =>
            sendMail(
                follow.follower.email,
                `${existingBlog.author.firstName} ${existingBlog.author.lastName}`,
                existingBlog.title,
                existingBlog.slug
            )
        )
    );

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

    const cacheKey = `blogs: detail: ${blogId}`;
    cache.del(cacheKey);
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

    const cacheKey = `blogs:detail:${blogId}`;
    cache.del(cacheKey);
    return deletedBlog;
}

export async function getBlogDetail(blogId: string) {

    const cacheKey = `blogs: detail: ${blogId}`;
    const cacheBlog = cache.get<any>(cacheKey);
    if (cacheBlog) {
        return cacheBlog;
    }

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

    const formattedBlog = {
        ...blog,
        likeCount: blog._count.likes,
    };

    cache.set(cacheKey, formattedBlog, 1 * 60 * 60 * 24);

    return formattedBlog;
}

export async function saveBlog(userId: string, blogId: string) {

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

    const cacheKey = `blogs:comments:${blogId}:page:${input.page}:size:${input.size}`;


    const cachedComments = cache.get<any>(cacheKey);
    if (cachedComments) {
        return cachedComments;
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

    const result = {
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

    cache.set(cacheKey, result, 1 * 60 * 60 * 24);

    return result;

}

export async function replyList(blogId: string, commentId: string, input: BlogListInput) {

    const cacheKey = `blogs:comments:${blogId}:page:${input.page}:size:${input.size}`;


    const cachedComments = cache.get<any>(cacheKey);
    if (cachedComments) {
        return cachedComments;
    }

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

    const result = {
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

    cache.set(cacheKey, result, 1 * 60 * 60 * 24);

    return result;
}

export async function viewBlog(blogId: string, userId: string) {

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
    if (blog.authorId === userId) {
        return { message: "Blog viewd fetched successfully" };
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const view = await prisma.view.upsert({
        where: {
            blogId_viewedAt_userId: {
                blogId: blogId,
                viewedAt: today,
                userId: userId,
            },
        },

        create: {
            blogId: blogId,
            viewedAt: today,
            userId: userId,

        },
        update: {},
    });

    return { message: "Blog viewd fetched successfully" };

}

export async function ownBlogList(authorId: string, input: BlogListInput) {

    const cacheKey = `user: blogs: ${authorId}: page: ${input.page}: size: ${input.size}`;

    const cachedBlog = cache.get<any>(cacheKey);
    if (cachedBlog) {
        return cachedBlog;
    }

    const skip = (input.page - 1) * input.size;

    const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
            where: {
                authorId: authorId,
                deletedAt: null,

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
                authorId: authorId,
                deletedAt: null,
            },
        }),

    ]);

    const result = {
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

    cache.set(cacheKey, result, 1 * 60 * 60 * 24);

    return result;
}


export async function getBlogStats(blogId: string, userId: string) {

    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            status: "PUBLISHED",
            deletedAt: null,
        },
        select: {
            id: true,
            title: true,
            authorId: true,
            _count: {
                select: {
                    likes: true,

                    views: true,
                },
            },

        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    if (blog.authorId !== userId) {
        throw new ApiError("You are not allowed thisblog statistics", 403);
    }

    const activeCommentsCount = await prisma.comment.count({
        where: {
            blogId: blogId,
            deletedAt: null
        }
    });

    const activeRepliesCount = await prisma.reply.count({
        where: {
            comment: {
                blogId: blogId
            },
            deletedAt: null
        }
    });
    return {
        blogId: blog.id,
        title: blog.title,
        authorId: blog.authorId,
        statistics: {
            likeCount: blog._count.likes,
            commentCount: activeCommentsCount + activeRepliesCount,
            viewCount: blog._count.views,
        }
    }
}


export async function readBlog(blogId: string, userId: string) {
    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            status: "PUBLISHED",
            deletedAt: null
        },
        select: {
            id: true,
            authorId: true,
        },
    });

    if (!blog) {
        throw new ApiError("B;og not found", 404);
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const view = await prisma.view.findUnique({
        where: {
            blogId_viewedAt_userId: {
                blogId: blogId,
                viewedAt: today,
                userId: userId,
            },
        },

    });

    if (!view) {
        throw new ApiError(
            "You must view the blog  before marking it as read", 400);
    }

    if (view.isRead) {
        throw new ApiError("Blog already marked as read", 400);
    }
    return prisma.view.update({
        where: {
            blogId_viewedAt_userId: {
                blogId: blogId,
                viewedAt: today,
                userId: userId,
            },
        },
        data: {
            isRead: true,
        },
    });
}

export async function getBlogEnagement(blogId: string, userId: string, input: GetEnagementInput) {

    const blog = await prisma.blog.findUnique({
        where: {
            id: blogId,
            deletedAt: null,
        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    if (blog.authorId !== userId) {
        throw new ApiError("You are not allowed to view this blog enagement", 403);
    }

    const inputDate = new Date(input.date);

    if (isNaN(inputDate.getTime())) {
        throw new ApiError("Invalid date format. Use YYYY-MM-DD", 400);
    }

    const startDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), 1));

    const endDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth() + 1, 1));

    const engagements =
        await prisma.view.findMany({
            where: {
                blogId,
                viewedAt: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            select: {
                viewedAt: true,
                isRead: true,
            },
            orderBy: {
                viewedAt: "asc",
            },
        });

    return {
        blogId: blog.id,
        title: blog.title,
        period: `${startDate} to ${endDate}`,
        views: engagements,
        totalviewRecord: engagements.length,
    };
}

export async function getBlogCategoryList(authorId: string, input: GetBlogListCategoryInput) {

    const where: Prisma.BlogWhereInput = {
        status: "PUBLISHED",
        deletedAt: null,
        authorId: {
            not: authorId,
        },
    };

    if (input.categoryId) {
        where.categories = {
            some: {
                id: input.categoryId,
            },
        };
    }

    const blogs = await prisma.blog.findMany({
        where,

        take: input.size + 1,

        ...(input.cursor && {
            cursor: {
                createdAt_id: {
                    createdAt: input.cursor.createdAt,
                    id: input.cursor.id,
                },
            },
            skip: 1,
        }),

        orderBy: [
            {
                createdAt: "desc",
            },
            {
                id: "desc",
            },
        ],

        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },

            categories: {
                select: {
                    id: true,
                    name: true,
                },
            },

            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });

    let nextCursor: { id: string; createdAt: Date } | null = null;

    if (blogs.length > input.size) {
        blogs.pop();
        const lastItem = blogs[blogs.length - 1];
        if (lastItem) {
            nextCursor = {
                id: lastItem.id,
                createdAt: lastItem.createdAt,
            };
        }
    }

    const formattedBlogs = blogs.map(({ _count, ...blog }) => ({
        ...blog,
        likeCount: _count.likes,
        commentCount: _count.comments,
    }));

    return {
        blogs: formattedBlogs,
        pagination: {
            nextCursor,
            size: input.size,
            hasNextPage: !!nextCursor,
        },
    };
}

export async function searchBlogs(currentUserId: string, input: CursorBlogListInput) {

    const where: Prisma.BlogWhereInput = {
        deletedAt: null,
        status: "PUBLISHED",
    };

    if (input.search) {
        where.title = {
            contains: input.search,
            mode: "insensitive",
        };
    }

    const blogs = await prisma.blog.findMany({
        where,

        take: input.size + 1,
        ...(input.cursor && {
            cursor: {
                createdAt_id: {
                    createdAt: input.cursor.createdAt,
                    id: input.cursor.id,
                },
            },
            skip: 1,
        }),

        select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,

            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,

                    followers: {
                        where: {
                            followerId: currentUserId,
                        },
                        select: {
                            id: true,
                            isSubscribed: true,
                        },
                    },

                    _count: {
                        select: {
                            followers: true,
                            following: true,
                        },
                    },
                },
            },
        },

        orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
        ],
    });

    let nextCursor: { id: string; createdAt: Date } | null = null;
    if (blogs.length > input.size) {
        blogs.pop();
        const lastItem = blogs[blogs.length - 1];
        if (lastItem) {
            nextCursor = {
                id: lastItem.id,
                createdAt: lastItem.createdAt,
            };
        }
    }


    return {
        blogs: blogs.map((blog) => {
            const author = blog.author;
            const isMe = author.id === currentUserId;

            return {
                id: blog.id,
                title: blog.title,
                content: blog.content,
                createdAt: blog.createdAt,

                author: {
                    id: author.id,
                    firstName: author.firstName,
                    lastName: author.lastName,
                    email: author.email,

                    followersCount: author._count.followers,
                    followingCount: author._count.following,

                    isMe,
                    isFollowed: isMe ? false : author.followers.length > 0,
                    isSubscribed: isMe
                        ? false
                        : author.followers.length > 0
                            ? author.followers[0].isSubscribed
                            : false,
                },
            };
        }),

        pagination: {
            nextCursor,
            size: input.size,
            hasNextPage: !!nextCursor,
        },
    };
}

export async function createReport(blogId: string, userId: string, input: CreateReportInput,) {

    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            deletedAt: null,
            status: "PUBLISHED",
        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    if (blog.authorId === userId) {
        throw new ApiError("You cannot report your own blog.", 400);
    }

    const category = await prisma.reportCategory.findUnique({
        where: {
            id: input.reportCategoryId,
        },
    });

    if (!category) {
        throw new ApiError("Report category not found", 404);
    }


    let report = await prisma.report.findUnique({
        where: { blogId },
    });

    if (!report) {
        report = await prisma.report.create({
            data: {
                blogId,
                status: "PENDING",
            },
        });
    }

    const alreadyReported = await prisma.reportInfo.findUnique({
        where: {
            reportId_userId_reportCategoryId: {
                reportId: report.id,
                userId,
                reportCategoryId: input.reportCategoryId,
            },
        },
    });

    if (alreadyReported) {
        throw new ApiError("You have already submitted a report under this category for this blog.", 400);
    }


    const reportInfo = await prisma.reportInfo.create({
        data: {
            reportId: report.id,
            userId,
            reportCategoryId: input.reportCategoryId,
            reason: input.reason,
        },
        include: {
            reportCategory: {
                select: { name: true },
            },
            report: {
                select: { status: true },
            },
        },
    });

    return reportInfo;
}

export async function getReportList(adminId: string, input: ReportListInput) {

    
    const skip = (input.page - 1) * input.size;

    const where: Prisma.ReportWhereInput = {};

    if (input.status !== null) {
        where.status = input.status;
    }

    if (input.startDate || input.endDate) {
        where.createdAt = {};


        if (input.startDate) {
            where.createdAt.gte = input.startDate;
        }

        if (input.endDate) {
            where.createdAt.lte = input.endDate;
        }

    }

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where,
            skip,
            take: input.size,

            include: {

                blog: {
                    select: {
                        id: true,
                        title: true,
                    },
                },

                _count: {
                    select: {
                        reportInfos: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.report.count({
            where,
        }),
    ]);


    return {
        reports: reports.map((report) => ({
            id: report.id,
            status: report.status,
            createdAt: report.createdAt,


            reportcount: report._count.reportInfos,
        })),

        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        },
    };

}

export async function getReportInfoList(adminId: string, reportId: string, input: ReportInfoListInput) {


    const report = await prisma.report.findUnique({
        where: {
            id: reportId,
        }
    });

    if (!report) {
        throw new ApiError("Report not found", 404);
    }

    const skip = (input.page - 1) * input.size;

    const where: Prisma.ReportInfoWhereInput = {
        reportId,
    };

    if (input.categoryId) {
        where.reportCategoryId = input.categoryId;
    }

    if (input.startDate || input.endDate) {
        where.createdAt = {};

        if (input.startDate) {
            where.createdAt.gte = input.startDate;
        }

        if (input.endDate) {
            where.createdAt.lte = input.endDate;
        }
    }

    const [reportInfos, total] = await Promise.all([
        prisma.reportInfo.findMany({
            where,
            skip,
            take: input.size,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },

                reportCategory: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.reportInfo.count({
            where,
        }),
    ]);

    return {
        reportInfos,

        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        },
    };

}

export async function deleteReport(adminId: string, reportId: string){
    const report = await prisma.report.findUnique({
        where: {
            id: reportId,
        },
    });

    if(!report) {
        throw new ApiError("Report not found", 404);
    }

    const blog = await prisma.blog.update({
        where: {
            id: report.blogId,
        },
        data: {
            deletedAt: new Date(),
        },
    });


    const reports = await prisma.report.update({
        where: {
            id: reportId,
        },
        data: {
            status: "ACTION_TAKEN",
        },
    });

    return reports;
}