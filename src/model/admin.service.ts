import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Prisma } from "../../generated/prisma/client";
import { ApiError } from "../controllers/api-error";
import { LoginInput } from "../dtos/login.dto";
import { signAccessToken } from "../model/jwt";
import { JwtPayload } from "jsonwebtoken";

export async function seedAdmin() {
    const existingAdmin = await prisma.admin.findUnique({
        where: {
            email: process.env.ADMIN_EMAIL!,
        },
    });

    if (existingAdmin) {
        return;
    }

    const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD!, 10
    );

    await prisma.admin.create({
        data: {
            name: "Admin",
            email: process.env.ADMIN_EMAIL!,
            password: hashedPassword,
        },
    });

    console.log("Admin created");
}

export async function login(input: LoginInput) {
    const admin = await prisma.admin.findUnique({
        where: {
            email: input.email,
        },
    });

    if (!admin) {
        throw new ApiError("Admin not found", 404);
    }

    const isSame = await bcrypt.compare(
        input.password,
        admin.password,
    );

    if (!isSame) {
        throw new ApiError("Password not match", 400);
    }


    const accessToken = signAccessToken(
        {
            id: admin.id,
            email: admin.email,
        },
        "15m"
    );


    return {
        accessToken: accessToken,
        data: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
        }
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

    if (report.status !== "PENDING") {
    throw new ApiError("Report has already been processed", 400);
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

export async function dismissReport(adminId: string, reportId: string){
    const report = await prisma.report.findUnique({
        where: {
            id: reportId,
        },
    });

    if(!report) {
        throw new ApiError("Report not found", 404);
    }

    if (report.status !== "PENDING") {
    throw new ApiError("Report has already been processed", 400);
}

 const reports = await prisma.report.update({
        where: {
            id: reportId,
        },
        data: {
            status: "DISMISSED",
        },
    });

    return reports;
}