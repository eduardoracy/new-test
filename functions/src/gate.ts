import { db, isWithinBlackout } from "./utils";
export async function evaluateGate(attemptedAt: Date, stationId: string,
    memberSection?: string) {
    const cfgSnap = await db.doc("config/app").get();
    const cfg = cfgSnap.data() as any || {};
    // 1) Blackout wins
    if (isWithinBlackout(cfg.blackoutWindows, attemptedAt)) {
        return {
            allowed: false, mode: "none" as const, sessionId: null, reason:
                "blackout"
        };
    }
    // 2) Manual override
    const manual: "neutral" | "open" | "closed" = cfg.evaluationGate?.manualState ??
        "neutral";
    if (manual === "open") return { allowed: true, mode: "manual" as const };
    if (manual === "closed") return {
        allowed: false, mode: "manual" as const,
        sessionId: null, reason: "manual_closed"
    };
    // 3) Sessions
    const requireSessions: boolean = cfg.evaluationGate?.requireSessions !==
        false;
    if (!requireSessions) return { allowed: true, mode: "none" as const };
    // Query sessions covering time
    const q = await db.collection("sessions")
        .where("start", "<=", attemptedAt)
        .where("end", ">=", attemptedAt)
        .where("canceled", "==", false)
        .limit(20)
        .get();
    // Basic global matching; station/section scopes optional (extensible)
    const match = q.docs.find(d => {
        const s = d.data() as any;
        const okStation = !s.scope?.stations || (s.scope.stations as
            string[]).includes(stationId);
        const okSection = !s.scope?.sections || (memberSection && (s.scope.sections as string[]).includes(memberSection));
    return okStation && (s.scope?.sections ? okSection : true);
});
if (match) return {
    allowed: true, mode: "session" as const, sessionId:
        match.id
};
return {
    allowed: false, mode: "session" as const, sessionId: null, reason:
        "no_active_session"
};
}