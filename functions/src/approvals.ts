import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db, requireAuth, assert } from "./utils";
export const approveAttempts = onCall(async (req) => {
    requireAuth(req);
    const uid = req.auth!.uid;
    const caller = await db.doc(`users/${uid}`).get();
    const roles = (caller.data() as any)?.roles || {};
    assert(roles.admin, "Admin only", "permission-denied");
    const { attemptIds } = req.data as { attemptIds: string[] };
    assert(Array.isArray(attemptIds) && attemptIds.length > 0, "No attempts provided");
const batch = db.batch();
    for (const id of attemptIds) {
        const ref = db.doc(`attempts/${id}`);
        const snap = await ref.get();
        if (!snap.exists) continue;
        const a = snap.data() as any;
        if (a.status !== "pending_approval") continue;
        batch.update(ref, { status: "final", type: "standard" });
        // Update progress
        const progRef = db.doc(`users/${a.memberUid}/progress/${a.stationId}`);
        batch.set(progRef, {
            latestScore: a.overallScore,
            latestAttemptId: ref.id,
            latestAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // Audit log
        const auditRef = db.collection("auditLogs").doc();
        batch.set(auditRef, {
            action: "attempt_approved",
            actorUid: uid,
            target: { collection: "attempts", id },
            at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();
    return { ok: true };
});