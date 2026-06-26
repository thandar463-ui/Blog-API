import { Request, Response, NextFunction } from "express";
import { User } from "../../generated/prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "../model/jwt";
import { ApiError } from "../controllers/api-error";
import { logger } from "../lib/logger";
import pino from "pino";



export interface AuthenticatedRequest extends Request {
    user?: User;
}


export async function authLogMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {

    try {
        const authorizationHeader = req.headers.authorization;

        if (!authorizationHeader) {
            logger.warn({ type: "missing-authorization-header", path: req.originalUrl });
            throw new ApiError("Authorization header must be provided", 401);
        }

        const splittedAuthHeader = authorizationHeader.split(" ");
        if (splittedAuthHeader.length !== 2 || splittedAuthHeader[0] !== "JWT") {
            throw new ApiError("Invalid authorization header format", 401);
        }

        const jwtToken = splittedAuthHeader[1];
        const payload = verifyAccessToken(jwtToken);

        if (typeof payload === "string" || !("id" in payload) || !payload.id) {
            logger.warn({ type: "invalid-jwt-payload" });
            throw new ApiError("Invalid jwt token", 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id as string },
        });

        if (!user) {
            logger.warn({ type: "user-not-found", userId: payload.id });
            throw new ApiError("User not found", 401);
        }

        req.user = user;
        next();

    } catch (err: any) {
        next(err);
    }
}