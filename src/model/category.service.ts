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


export async function getReportCategoryList() {
    const cacheKey = "global:report_categories";

    const cachedReportCategories = cache.get<any>(cacheKey);
    if (cachedReportCategories) {
        return cachedReportCategories;
    }

    try {

        const reportCategories = await prisma.reportCategory.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        cache.set(cacheKey, reportCategories, 1 * 60 * 60 * 24 * 7);

        return reportCategories;

    } catch (error) {
        throw new ApiError("Failed to fetch report categories", 500);
    }
}