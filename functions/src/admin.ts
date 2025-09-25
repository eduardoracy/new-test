import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db, requireAuth, assert } from "./utils";
export const adminUpdateConfig = onCall(async (req) => {
    requireAuth(req);
    const roles = (await db.doc(`users/${req.auth!.uid}`).get()).data()?.roles ||
        {};
    assert(roles.admin, "Admin only", "permission-denied");
    const patch = req.data as Record<string, unknown>;
    const ref = db.doc("config/app");
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const next = {
            ...(snap.data() || {}), ...patch, updatedAt:
                admin.firestore.FieldValue.serverTimestamp()
        };
        tx.set(ref, next, { merge: true });
        tx.set(db.collection("auditLogs").doc(), {
            action: "config_update",
            actorUid: req.auth!.uid,
            patch,
            at: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    return { ok: true };
});
export const adminCreateSession = onCall(async (req) => {
    requireAuth(req);
    const roles = (await db.doc(`users/${req.auth!.uid}`).get()).data()?.roles ||
        {};
    assert(roles.admin, "Admin only", "permission-denied");
    const { title, start, end, scope } = req.data as any;
    const ref = db.collection("sessions").doc();
    await ref.set({
        title, start: new Date(start), end: new Date(end), scope:
            scope || null, canceled: false, createdByUid: req.auth!.uid, createdAt:
            admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: ref.id };
});
export const adminCancelSession = onCall(async (req) => {
    requireAuth(req);
    const roles = (await db.doc(`users/${req.auth!.uid}`).get()).data()?.roles ||
        {};
    assert(roles.admin, "Admin only", "permission-denied");
    const { sessionId } = req.data as any;
    await db.doc(`sessions/${sessionId}`).set({ canceled: true }, {
        merge:
            true
    });
    return { ok: true };
});
export const clearProgress = onCall(async (req) => {
    requireAuth(req);
    const roles = (await db.doc(`users/${req.auth!.uid}`).get()).data()?.roles ||
        {};
    assert(roles.admin, "Admin only", "permission-denied");
    const { stationId } = req.data as { stationId: string };
    const usersSnap = await db.collection("users").get();
    const batch = db.batch();
    usersSnap.docs.forEach(u => {
        const progRef = db.doc(`users/${u.id}/progress/${stationId}`);
        batch.delete(progRef);
    });
    // Audit
    batch.set(db.collection("auditLogs").doc(), {
        action: "progress_cleared",
        actorUid: req.auth!.uid,
        target: { stationId },
        at: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return { ok: true, count: usersSnap.size };
});
export const reorderStations = onCall(async (req) => {
    requireAuth(req);
    const roles = (await db.doc(`users/${req.auth!.uid}`).get()).data()?.roles ||
        {};
    assert(roles.admin, "Admin only", "permission-denied");
    const { orders } = req.data as { orders: Record<string, number> };
    const batch = db.batch();
    for (const [stationId, order] of Object.entries(orders)) {
        batch.set(db.doc(`stations/${stationId}`), { order }, { merge: true });
    }
    await batch.commit();
    return { ok: true };
});