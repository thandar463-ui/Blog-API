import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiError } from "../controllers/api-error";
import { RegisterInput } from "../dtos/register-api.dto";

export async function register(input: RegisterInput) {

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
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    });

    return user;
}