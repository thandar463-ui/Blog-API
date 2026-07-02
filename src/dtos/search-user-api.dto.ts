import { z } from "zod";

export const SearchUserApiDto = z.object({
    cursor: z.object({
        firstName: z.string(),
        lastName: z.string(),
        id: z.string(),
    }).optional(),
    size: z.coerce.number(),
    search: z.string().optional(),
});

export type SearchUserApiInput = z.infer<typeof SearchUserApiDto>;