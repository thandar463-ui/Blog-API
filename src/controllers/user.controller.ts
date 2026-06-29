import { Request, Response, NextFunction } from "express";
import * as userService from "../model/user.service";
import { ApiError } from "./api-error";
import { RegisterDto } from "../dtos/register-api.dto";
import { LoginDto } from "../dtos/login.dto";
import { RefreshTokenDto } from "../dtos/refresh-token.dto";
import { handleErrors } from "./handle-error";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { SearchUserApiDto } from "../dtos/search-user-api.dto";
import { BlogListDto } from "../dtos/blog-list.dto";


/**
 * REGISTER USER CONTROLLER
 */
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await userService.register(req.body);

        return res.status(201).json({
            message: "User registered successfully",
            data: user,
        });
    } catch (err) {
        next(err);
    }
}



export async function login(req: Request, res: Response, next: NextFunction) {
    try {

        const body = req.body;

        const input = LoginDto.parse(body);

        const token = await userService.login(input);

        return res.json({
            data: token,
            message: "Logined successfully!"
        });
    } catch (err) {
        next(err);
    }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const input = RefreshTokenDto.parse(req.body);

        const data = await userService.refreshAccesstoken(input.refreshToken);

        res.status(200).json({ data, message: " Access token generated successfully", });
    } catch (err) {
        next(err);
    }
}


export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const user = await userService.getMe(req.user.id);

        return res.status(200).json({
            data: user,
            message: "User profile fetched successfully",
        });
    } catch (err) {
        next(err);
    }
}

export async function searchUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const input = SearchUserApiDto.parse(req.body);

        const result = await userService.searchUser(req.user.id, input);

        return res.status(200).json({
            message: "Users searched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function followUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followingId) {
            return res.status(400).json({ message: "Following user not found", });
        }

        const result = await userService.followUser(followerId, followingId as string);

        return res.status(200).json({
            message: "User followed successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function unfollowUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followingId) {
            return res.status(400).json({ message: "Following user not found", });
        }

        const result = await userService.unfollowUser(followerId, followingId as string);

        return res.status(200).json({
            message: "User unfollowed successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getFollowersList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followingId) {
            return res.status(400).json({ message: "Following user not found", });
        }

        const input = BlogListDto.parse(req.body);

        const result = await userService.getFollowersList(followerId, followingId as string, input);

        return res.status(200).json({
            message: "Follower list fetched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getFollowingList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const currentUserId = req.user?.id;

        const followerId = req.params.id;

        if (!followerId) {
            return res.status(400).json({ message: "Follower not found", });
        }

        const input = BlogListDto.parse(req.body);

        const result = await userService.getFollowingList(followerId as string, currentUserId, input);

        return res.status(200).json({
            message: "Following list fetched successfully",
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

