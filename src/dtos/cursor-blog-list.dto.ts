import { z } from "zod";

export const CursorBlogListDto = z.object({
    cursor: z.object({
        id: z.string(),
        createdAt: z.coerce.date(),
    }).optional(),

    size: z.coerce.number(),
    search: z.string().optional(),
});

export type CursorBlogListInput = z.infer<typeof CursorBlogListDto>;