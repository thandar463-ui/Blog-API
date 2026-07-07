import { Request, Response, NextFunction } from "express";
import * as adminService from "../model/admin.service";
import { ApiError } from "./api-error";
import { LoginDto } from "../dtos/login.dto";
import { handleErrors } from "./handle-error";
import { AuthenticatedRequest } from "../middlewares/admin.middleware";


export async function login(req: Request, res: Response, next: NextFunction) {
    try {

        const body = req.body;

        const input = LoginDto.parse(body);

        const token = await adminService.login(input);

        return res.json({
            data: token,
            message: "Logined successfully!"
        });
    } catch (err) {
        next(err);
    }
}

