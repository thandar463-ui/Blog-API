import { z } from "zod";
export const CreateBlogApiDto = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string(),
    status: z.enum(["DRAFT", "PUBLISHED"]),

});
export type CreateBlogApiInput = z.infer<typeof CreateBlogApiDto>;