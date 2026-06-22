import { z } from "zod";
export const CreateReplyApiDto = z.object({
    content: z.string().trim(),
    commentId: z.string().cuid(),
});

export type CreateReplyApiInput = z.infer<typeof CreateReplyApiDto>;