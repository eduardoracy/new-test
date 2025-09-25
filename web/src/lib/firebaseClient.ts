import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    signInWithPopup,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

const required = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
    throw new Error(
        `Missing Firebase env vars: ${missing.join(
            ", "
        )}. Put them in web/.env.local (copy from Firebase Web App config).`
    );
}

export const app =
    getApps().length > 0
        ? getApp()
        : initializeApp({
            apiKey: cfg.apiKey!,
            authDomain: cfg.authDomain!,
            projectId: cfg.projectId!,
            storageBucket: cfg.storageBucket, // optional
            messagingSenderId: cfg.messagingSenderId, // optional
            appId: cfg.appId!,
            measurementId: cfg.measurementId, // optional
        });

export const auth = getAuth(app);
export const db = getFirestore(app);

export function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function sendMagicLink(email: string) {
    const actionCodeSettings = {
        url: window.location.origin + "/",
        handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", email);
}

export async function completeMagicLink() {
    // Only proceed if it's really a magic-sign-in URL
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
        email = window.prompt("Please provide your email for confirmation") || "";
    }
    if (!email) return;

    await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem("emailForSignIn");
    // Optional: clean the URL so refreshes don’t re-trigger
    const url = new URL(window.location.href);
    ["oobCode", "mode", "apiKey", "lang", "continueUrl"].forEach((k) =>
        url.searchParams.delete(k)
    );
    window.history.replaceState({}, "", url.toString());
}
