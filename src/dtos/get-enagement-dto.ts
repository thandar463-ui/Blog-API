import { z } from "zod";
export const GetEnagementDto = z.object({
    date: z.string().date(),
});

export type GetEnagementInput = z.infer<typeof GetEnagementDto>;