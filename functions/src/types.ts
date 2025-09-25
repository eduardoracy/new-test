// Shared domain types for Functions
export type Score = "Developing" | "Proficient" | "Mastery";
export interface CategoryScoreMap {
    [categoryId: string]: Score;
}
export interface Attempt {
    memberUid: string;
    evaluatorUid: string;
    stationId: string;
    categories: CategoryScoreMap;
    overallScore: Score;
    comment?: string;
    createdAt: FirebaseFirestore.FieldValue;
    type: "standard" | "admin_correction" | "pending_approval";
    status: "final" | "pending_approval";
    reasonIfPending?: string;
    attemptedAtServer?: FirebaseFirestore.FieldValue;
    attemptedAtClient?: FirebaseFirestore.Timestamp | null;
    clientClockSkewMs?: number | null;
    evaluatorRoleSnapshot: {
        admin: boolean; sectionLeader: boolean; evaluator:
            boolean
    };
    gateDecision: {
        mode: "manual" | "session" | "none";
        sessionId?: string | null;
        allowedAtSubmit: boolean;
        reason?: string;
    };
}
export interface AppConfig {
    evaluatorCanSeeLatest: boolean;
    minAttemptGapMinutesDefault: number;
    forceSubmitReasonRequired: boolean;
    qrEnabled: boolean;
    exports?: { sheetsEnabled?: boolean; sheetUrl?: string };
    banner?: {
        active: boolean; message: string; level: string; start: any; end:
            any
    };
    blackoutWindows?: {
        start: FirebaseFirestore.Timestamp; end:
            FirebaseFirestore.Timestamp; reason?: string
    }[];
    evaluationGate?: {
        manualState: "neutral" | "open" | "closed";
        requireSessions: boolean;
        graceLateSubmitMinutes: number;
    };
}