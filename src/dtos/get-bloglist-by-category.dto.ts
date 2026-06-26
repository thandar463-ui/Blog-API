import { z } from "zod";
export const GetBlogListCategoryDto = z.object({
    page: z.coerce.number(),
    size: z.coerce.number(),
    categoryId: z.string().optional(),
});

export type GetBlogListCategoryInput = z.infer<typeof GetBlogListCategoryDto>;