import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
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