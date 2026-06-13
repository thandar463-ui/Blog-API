import { z } from "zod";
export const LoginDto = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(20),
});

export type LoginInput = z.infer<typeof LoginDto>;