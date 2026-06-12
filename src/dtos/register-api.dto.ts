import { z } from "zod";
export const RegisterDto = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    password: z.string().min(6).max(20),

});
export type RegisterInput = z.infer<typeof RegisterDto>;