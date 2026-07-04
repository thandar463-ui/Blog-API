import { z } from "zod";
export const CreateReportDto = z.object({
    reportCategoryId: z.string(),
    reason: z.string().optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportDto>;