import { Request, Response, NextFunction } from "express";
import * as userService from "../model/user.service";
import { ApiError } from "./api-error";
import { RegisterDto } from "../dtos/register-api.dto";
import { LoginDto } from "../dtos/login.dto";
import { RefreshTokenDto } from "../dtos/refresh-token.dto";
import { handleErrors } from "./handle-error";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";


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