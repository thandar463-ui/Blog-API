import { z } from "zod";
export const RefreshTokenDto = z.object({
    refreshToken: z.string(),

});

export type RefreshTokenInput = z.infer<typeof RefreshTokenDto>;