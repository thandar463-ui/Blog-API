import { z } from "zod";

export const SearchUserApiDto = z.object({
    page: z.coerce.number(),
    size: z.coerce.number(),
    search: z.string().optional(),
});

export type SearchUserApiInput = z.infer<typeof SearchUserApiDto>;