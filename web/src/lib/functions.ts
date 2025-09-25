import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebaseClient";
const fns = getFunctions(app);
export const fn = {
    submitAttempt: httpsCallable(fns, "submitAttempt"),
    approveAttempts: httpsCallable(fns, "approveAttempts"),
    adminUpdateConfig: httpsCallable(fns, "adminUpdateConfig"),
    adminCreateSession: httpsCallable(fns, "adminCreateSession"),
    adminCancelSession: httpsCallable(fns, "adminCancelSession"),
    clearProgress: httpsCallable(fns, "clearProgress"),
    reorderStations: httpsCallable(fns, "reorderStations"),
};