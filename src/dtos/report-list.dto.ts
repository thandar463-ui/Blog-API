import { z } from "zod";
export const ReportListDto = z.object({
    status: z.enum(["PENDING", "ACTION_TAKEN", "DISMISSED"]).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number(),
    size: z.coerce.number(),
});
export type ReportListInput = z.infer<typeof ReportListDto>;