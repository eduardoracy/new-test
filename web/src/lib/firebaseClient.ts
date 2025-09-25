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
    apiKey: "AIzaSyBVCUuKFF67JLiBFb2xw56eBxmRDYeQyF4",
    authDomain: "hmb-vtc.firebaseapp.com",
    projectId: "hmb-vtc",
    appId: "1:748227134098:web:79c06a3eec93894e38dc4b",
    // Add other optional config values as needed
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

// Remove the environment variable check and directly use cfg values
if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
    throw new Error(
        `Missing required Firebase configuration values. Check your config object.`
    );
}

export const app =
    getApps().length > 0
        ? getApp()
        : initializeApp({
            apiKey: cfg.apiKey,
            authDomain: cfg.authDomain,
            projectId: cfg.projectId,
            storageBucket: cfg.storageBucket,
            messagingSenderId: cfg.messagingSenderId,
            appId: cfg.appId,
            measurementId: cfg.measurementId,
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
