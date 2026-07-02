import { z } from "zod";
export const GetBlogListCategoryDto = z.object({
    cursor: z.string().optional(),
    size: z.coerce.number(),
    categoryId: z.string().optional(),
});

export type GetBlogListCategoryInput = z.infer<typeof GetBlogListCategoryDto>;