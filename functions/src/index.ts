import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { submitAttempt } from "./submitAttempt";
import { approveAttempts } from "./approvals";
import {
    adminUpdateConfig,
    adminCreateSession,
    adminCancelSession,
    clearProgress,
    reorderStations,
} from "./admin";

try { admin.initializeApp(); } catch { /* already initialized */ }

export {
    submitAttempt,
    approveAttempts,
    adminUpdateConfig,
    adminCreateSession,
    adminCancelSession,
    clearProgress,
    reorderStations,
};

// Optional: QR deep-link resolver (HTTP)
export const scanQr = onRequest({ cors: true }, async (req, res) => {
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return; // <<< return void
    }

    const { uid, token } = req.query as { uid?: string; token?: string };
    if (!uid || !token) {
        res.status(400).json({ error: "Missing params" });
        return; // <<< return void
    }

    const user = await admin.firestore().doc(`users/${uid}`).get();
    if (!user.exists) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    const data = user.data() as any;
    const ok = data.qrToken === token;
    if (!ok) {
        res.status(403).json({ error: "Invalid token" });
        return;
    }

    res.status(200).json({
        uid: user.id,
        displayName: data.displayName ?? null,
        userId: data.userId ?? null,
        section: data.section ?? null,
    });
    // NOTE: do not `return res.json(...)`; just end the function.
});
