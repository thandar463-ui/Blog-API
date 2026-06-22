import { z } from "zod";
export const CreateCommentApiDto = z.object({

    content: z.string().min(1),
    blogId: z.string().cuid(),

});
export type CreateCommentApiInput = z.infer<typeof CreateCommentApiDto>;