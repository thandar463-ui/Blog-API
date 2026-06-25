import { prisma } from "../lib/prisma";
import { ApiError } from "../controllers/api-error";

export async function getCategoryList() {
    return prisma.category.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });
}