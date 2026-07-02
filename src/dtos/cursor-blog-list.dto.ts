import { z } from "zod";

export const CursorBlogListDto = z.object({
    cursor: z.string().optional(),
    size: z.coerce.number(),
    search: z.string().optional(),
});

export type CursorBlogListInput = z.infer<typeof CursorBlogListDto>;