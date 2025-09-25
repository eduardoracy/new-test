import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db, requireAuth, assert, now, minScore, getUser } from "./utils";
import { evaluateGate } from "./gate";
import { Score } from "./types";
// Helper: check evaluator roles/eligibility. For brevity, only role gates shown.
async function checkEvaluatorEligibility(evaluatorUid: string, stationId: string) {
    const u = await getUser(evaluatorUid);
    const roles = u.roles || {};
    // Admins & section leaders can always evaluate
    if (roles.admin || roles.sectionLeader) return true;
// Otherwise must have evaluator: true, and (skill-based eligibility can be added here)
    return !!roles.evaluator;
}
// Helper: member progression prerequisite (≥ Proficient in previous station).
async function checkMemberPrereq(memberUid: string, stationId: string) {
    // Load stations ordered, find prev station, check member progress
    const stations = await db.collection("stations").orderBy("order",
        "asc").get();
    const list = stations.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    const idx = list.findIndex(s => s.id === stationId);
    if (idx <= 0) return true; // First station has no prereq
    const prevId = list[idx - 1].id;
    const prog = await db.doc(`users/${memberUid}/progress/${prevId}`).get();
    const latest = prog.exists ? (prog.data() as any).latestScore as Score |
        null : null;
    return latest === "Proficient" || latest === "Mastery";
}
export const submitAttempt = onCall(async (req) => {
    requireAuth(req);
    const evaluatorUid = req.auth!.uid;
    const { memberUid, stationId, categories, comment, forceSubmit,
        attemptedAtClient, clientClockSkewMs } = req.data as any;
    assert(memberUid && stationId && categories && typeof categories ===
        'object', "Missing fields");
    assert(await checkEvaluatorEligibility(evaluatorUid, stationId), "Evaluator not eligible", "permission-denied");
assert(await checkMemberPrereq(memberUid, stationId), "Member prerequisites not met", "failed-precondition");
// Determine attempt time and gate
const cfg = (await db.doc("config/app").get()).data() as any || {};
    const graceMin = cfg.evaluationGate?.graceLateSubmitMinutes ?? 10;
    const serverNow = new Date();
    const estClient = attemptedAtClient ? new Date(attemptedAtClient) : null;
    const skew = typeof clientClockSkewMs === 'number' ? clientClockSkewMs : 0;
    const attemptedAtEst = estClient ? new Date(estClient.getTime() - skew) :
        serverNow;
    // Apply grace only for offline/queued path where client time provided
    const gateCheckTime = attemptedAtClient ? attemptedAtEst : serverNow;
    const gate = await evaluateGate(gateCheckTime, stationId, (await
        getUser(memberUid)).section);
    const allowed = gate.allowed || false;
    // Compute overall score
    const vals = Object.values(categories) as Score[];
    assert(vals.length > 0, "No categories scored");
    const overall = minScore(vals);
    const attemptRef = db.collection("attempts").doc();
    const progressRef = db.doc(`users/${memberUid}/progress/${stationId}`);
    const auditRef = db.collection("auditLogs").doc();
    // Pending approval path (force or out-of-window)
    const shouldPend = (!allowed) || (!!forceSubmit);
    await db.runTransaction(async (tx) => {
        const evaluator = await tx.get(db.doc(`users/${evaluatorUid}`));
        const roles = (evaluator.data() as any)?.roles || {};
        const attemptData = {
            memberUid,
            evaluatorUid,
            stationId,
            categories,
            overallScore: overall,
            comment: comment || "",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            attemptedAtServer: admin.firestore.FieldValue.serverTimestamp(),
            attemptedAtClient: attemptedAtClient ?
                admin.firestore.Timestamp.fromDate(new Date(attemptedAtClient)) : null,
            clientClockSkewMs: attemptedAtClient ? (clientClockSkewMs ?? null) : null,
            type: shouldPend ? "pending_approval" : "standard",
            status: shouldPend ? "pending_approval" : "final",
            reasonIfPending: shouldPend ? (forceSubmit ? "force_submit" : gate.reason
                || "gate_closed") : undefined,
            evaluatorRoleSnapshot: {
                admin: !!roles.admin, sectionLeader: !!
                    roles.sectionLeader, evaluator: !!roles.evaluator
            },
            gateDecision: {
                mode: gate.mode, sessionId: gate.sessionId ?? null,
                allowedAtSubmit: allowed, reason: gate.reason
            }
        } as const;
        tx.set(attemptRef, attemptData);
        if (!shouldPend) {
// Update progress snapshot atomically (mutable rubric; grandfather handled by stored snapshot when passing)
    const latest = {
        latestScore: overall,
        latestAttemptId: attemptRef.id,
        latestAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    tx.set(progressRef, latest, { merge: true });
}
tx.set(auditRef, {
    action: shouldPend ? "attempt_submit_pending" : "attempt_submit_final",
    actorUid: evaluatorUid,
    target: { collection: "attempts", id: attemptRef.id },
    at: admin.firestore.FieldValue.serverTimestamp(),
});
});
return {
    status: shouldPend ? "pending_approval" : "final", attemptId:
        attemptRef.id
};
});