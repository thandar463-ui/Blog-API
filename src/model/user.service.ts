import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Prisma } from "../../generated/prisma/client";
import { ApiError } from "../controllers/api-error";
import { RegisterInput } from "../dtos/register-api.dto";
import { LoginInput } from "../dtos/login.dto";
import { RefreshTokenInput } from "../dtos/refresh-token.dto";
import { User } from "../../generated/prisma/client";
import {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken, verifyRefreshToken,
} from "../model/jwt";
import { JwtPayload } from "jsonwebtoken";
import { SearchUserApiInput } from "../dtos/search-user-api.dto";
import { BlogListInput } from "../dtos/blog-list.dto";


export async function register(input: RegisterInput): Promise<User> {

    // check duplicate email
    const existingUser = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (existingUser) {
        throw new ApiError("Duplicate email", 400);
    }

    // hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // create user
    const user = await prisma.user.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            password: hashedPassword,
        },

    });

    return user;
}


export async function login(input: LoginInput): Promise<any> {
    const user = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    const isMatch = await bcrypt.compare(
        input.password,
        user.password
    );

    if (!isMatch) {
        throw new ApiError("Invalid password", 400);
    }

    const accessToken = signAccessToken(
        {
            id: user.id,
            email: user.email,
        },
        "15m"
    );

    const refreshToken = signRefreshToken(
        {
            id: user.id,
            email: user.email,
        },
        "7d"
    );
    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        },
    };
}

export async function refreshAccesstoken(refreshToken: string) {
    if (!refreshToken) {
        throw new ApiError("Refresh token is required", 400);
    }

    try {
        const user = verifyRefreshToken(refreshToken) as JwtPayload;
        const accessToken = signAccessToken(
            {
                id: user.id,
                email: user.email,
            },
            "15m"
        );

        return {
            accessToken,
        };
    } catch {
        throw new ApiError("Invalid refresh token", 401);
    }
}


export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },

    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }
    return user;
}

export async function searchUser(currentUserId: string, input: SearchUserApiInput) {
    const skip = (input.page - 1) * input.size;
    const where: Prisma.UserWhereInput = {
        id: {
            not: currentUserId,
        },

        ...(input.search && {
            OR: [
                {
                    firstName: {
                        contains: input.search,
                        mode: "insensitive" as const,
                    },
                },

                {
                    lastName: {
                        contains: input.search,
                        mode: "insensitive" as const,
                    },
                },

                {
                    email: {
                        contains: input.search,
                        mode: "insensitive" as const,
                    },
                },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: input.size,
            orderBy: {
                createdAt: "desc",
            },

            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,

                _count: {
                    select: {
                        followers: true,
                        following: true,
                    },
                },

                followers: {
                    where: {
                        followerId: currentUserId,
                    },
                    select: {
                        id: true,
                    },
                },
            },
        }),

        prisma.user.count({
            where,
        }),
    ]);

    return {
        users: users.map((user) => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,

            followersCount: user._count.followers,
            followingCount: user._count.following,

            isFollowed: user.followers.length > 0,
        })),

        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        },
    };
}

export async function followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new ApiError("You cannot follow yourself", 400);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: followingId,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    const existing = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: followerId,
                followingId: followingId,
            },
        },
    });


    if (existing) {
        throw new ApiError("Already following user", 400);
    }

    const newFollower = await prisma.follow.create({
        data: {
            followerId: followerId,
            followingId: followingId,
        },
    });


    return newFollower;
}

export async function unfollowUser(followerId: string, followingId: string) {
    const existing = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
    });

    if (!existing) {
        throw new ApiError("You are not following this user", 400);
    }

    const unfollow = await prisma.follow.delete({
        where: {
            id: existing.id,
        },
    });

    return unfollow;
}


export async function getFollowersList(followerId: string, followingId: string, input: BlogListInput) {

    const skip = (input.page - 1) * input.size;

    const [followers, total] = await Promise.all([
        prisma.follow.findMany({
            where: {
                followingId: followingId,

            },
            skip,
            take: input.size,

            include: {
                follower: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,

                        followers: {
                            where: {
                                followerId: followerId,
                            },
                            select: {
                                id: true,
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

        }),

        prisma.follow.count({
            where: {
                followingId: followingId,
            },
        }),
    ]);

    return {
        followers: followers.map((followRow) => {
            const isMe = followRow.follower.id === followerId;

            return {
                id: followRow.follower.id,
                firstname: followRow.follower.firstName,
                lastname: followRow.follower.lastName,
                email: followRow.follower.email,
                followersCount: followRow.follower._count.followers,
                followingCount: followRow.follower._count.following,
                isMe,

            };

        }),
        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        }
    };
}

export async function getFollowingList(followerId: string, currentUserId: string, input: BlogListInput) {

    const skip = (input.page - 1) * input.size;

    const [following, total] = await Promise.all([
        prisma.follow.findMany({
            where: {
                followerId: followerId,

            },
            skip,
            take: input.size,

            include: {
                following: {
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

        }),

        prisma.follow.count({
            where: {
                followerId: followerId,
            },
        }),
    ]);

    return {
        following: following.map((followRow) => {
            const isMe = followRow.following.id === currentUserId;
            return {
                id: followRow.following.id,
                firstname: followRow.following.firstName,
                lastname: followRow.following.lastName,
                email: followRow.following.email,
                followersCount: followRow.following._count.followers,
                followingCount: followRow.following._count.following,
                isMe: isMe,
            }

        }),
        pagination: {
            page: input.page,
            size: input.size,
            total,
            totalPages: Math.ceil(total / input.size),
        }
    };
}

export async function subscribeUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new ApiError("You cannot subscribe yourself", 400);
    }


    const subscription = await prisma.follow.upsert({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },

        update: {
            isSubscribed: true,
        },

        create: {
            followerId,
            followingId,
            isSubscribed: true,
        },
    });

    return subscription;

}

export async function unsubscribeUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new ApiError("You cannot unsubscribe yourself", 400);
    }

    {
        const existing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (!existing) {
            throw new ApiError("Subscription not found", 404);
        }

        if (!existing.isSubscribed) {
            throw new ApiError("Already unsubscribed", 400);
        }

        const updated = await prisma.follow.update({
            where: {
                id: existing.id,
            },
            data: {
                isSubscribed: false,
            },
        });


        return {
            message: "Unsubscribed successfully",
            data: updated,
        };
    }
}