import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// (1) Source of truth for codes
export const ERROR_CODES = [
    "cancelled", "unknown", "invalid-argument", "deadline-exceeded", "not-found",
    "already-exists", "permission-denied", "resource-exhausted", "failed-precondition",
    "aborted", "out-of-range", "unimplemented", "internal", "unavailable",
    "data-loss", "unauthenticated",
] as const;

// (2) Strong union type derived from the list
export type HttpsErrorCode = typeof ERROR_CODES[number];

export const db = admin.firestore();

/** Throw a typed HttpsError when condition is false. */
export function assert(
    condition: unknown,
    message: string,
    code: HttpsErrorCode = "failed-precondition"
): asserts condition {
    if (!condition) throw new HttpsError(code, message);
}

/** Require auth for callable functions (v2). */
export function requireAuth<T = unknown>(ctx: CallableRequest<T>) {
    if (!ctx.auth) throw new HttpsError("unauthenticated", "Authentication required");
}


export async function getUser(uid: string) {
    const snap = await db.doc(`users/${uid}`).get();
    if (!snap.exists) throw new HttpsError("not-found", "User not found");
    return { id: snap.id, ...(snap.data() as any) };
}

export function now() {
    return admin.firestore.FieldValue.serverTimestamp();
}

export function isWithinBlackout(
    windows:
        | { start: FirebaseFirestore.Timestamp; end: FirebaseFirestore.Timestamp; reason?: string }[]
        | undefined,
    at: Date
) {
    if (!windows || windows.length === 0) return false;
    const t = at.getTime();
    return windows.some((w) => w.start.toDate().getTime() <= t && w.end.toDate().getTime() >= t);
}

export function minScore(
    scores: ("Developing" | "Proficient" | "Mastery")[]
): "Developing" | "Proficient" | "Mastery" {
    // Order: Developing < Proficient < Mastery
    const order = { Developing: 0, Proficient: 1, Mastery: 2 } as const;
    return scores.reduce((min, s) => (order[s] < order[min] ? s : min), "Mastery");
}
