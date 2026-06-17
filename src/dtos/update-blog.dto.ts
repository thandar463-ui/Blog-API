import { z } from "zod";
export const UpdateBlogDto = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
});

export type UpdateBlogInput = z.infer<typeof UpdateBlogDto>;