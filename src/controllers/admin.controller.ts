import { Request, Response, NextFunction } from "express";
import * as adminService from "../model/admin.service";
import { ApiError } from "./api-error";
import { LoginDto } from "../dtos/login.dto";
import { handleErrors } from "./handle-error";
import { AdminAuthenticatedRequest } from "../middlewares/admin.middleware";


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

export async function deleteReport(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.admin) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const adminId = req.admin?.id;
        const reportId = req.params.id;

        if (!reportId) {
            return res.status(400).json({ message: "Report id is required", });
        }
       

        const result = await adminService.deleteReport(adminId, reportId as string);

        return res.status(200).json({
            message: "Admin deleted report blog successfully",
            adminId,
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }

}

export async function dismissReport(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
    try {

        if (!req.admin) {
            return res.status(401).json({ message: "Unauthorized", });
        }
        const adminId = req.admin?.id;
        const reportId = req.params.id;

        if (!reportId) {
            return res.status(400).json({ message: "Report id is required", });
        }
       

        const result = await adminService.dismissReport(adminId, reportId as string);

        return res.status(200).json({
            message: "Admin dismissed report  successfully",
            adminId,
            data: result,
        });
    } catch (err) {
        handleErrors(res, err);
    }

}
