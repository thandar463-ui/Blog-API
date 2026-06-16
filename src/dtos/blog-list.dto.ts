import { z } from "zod";

export const BlogListDto = z.object({
    page: z.coerce.number(),
    size: z.coerce.number(),
});

export type BlogListInput = z.infer<typeof BlogListDto>;