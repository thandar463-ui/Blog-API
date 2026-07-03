import { prisma } from "../lib/prisma";
import { Cache } from "../lib/cache";
import { ApiError } from "../controllers/api-error";

const cache = Cache.getInstance();

export async function getCategoryList() {

    const cacheKey = "global:categories";

    const cachedCategories = cache.get<any>(cacheKey);
    if (cachedCategories) {
        return cachedCategories;
    }

    try {
        const categories = prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        cache.set(cacheKey, categories, 1 * 60 * 60 * 24 * 7);

        return categories;
    } catch (error) {
        throw new ApiError("Failed to fetch categories", 500);
    }

}