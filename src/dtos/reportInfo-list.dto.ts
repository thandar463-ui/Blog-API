import { z } from "zod";

export const ReportInfoListDto = z.object({
    page: z.coerce.number(),
    size: z.coerce.number(),
    categoryId: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

export type ReportInfoListInput = z.infer<typeof ReportInfoListDto>;