import { z } from "zod";
export const AppConfigSchema = z.object({
    evaluatorCanSeeLatest: z.boolean().default(true),
    minAttemptGapMinutesDefault: z.number().int().min(0).max(240).default(30),
    forceSubmitReasonRequired: z.boolean().default(true),
    qrEnabled: z.boolean().default(true),
    evaluationGate: z.object({
        manualState: z.enum(["neutral", "open", "closed"]).default("neutral"),
        requireSessions: z.boolean().default(true),
        graceLateSubmitMinutes: z.number().int().min(0).max(60).default(10),
    }).default({
        manualState: "neutral", requireSessions: true,
        graceLateSubmitMinutes: 10
    }),
});