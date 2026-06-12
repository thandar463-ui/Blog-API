import { Request, Response, NextFunction } from "express";
import * as userService from "../model/user.service";
import { ApiError } from "./api-error";
import { RegisterDto } from "../dtos/register-api.dto";
import { handleErrors } from "./handle-error";

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