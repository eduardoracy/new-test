"use client";

import { useEffect } from "react";

/** Completes Firebase email link sign-in only when the URL is a magic link. */
export default function MagicLinkClient() {
    useEffect(() => {
        // Guard: only run in the browser and only if the URL has an oobCode (magic link)
        if (typeof window === "undefined") return;
        const url = window.location.href;
        if (!/[?&]oobCode=/.test(url)) return;

        (async () => {
            try {
                // Lazy-load your firebase client to avoid SSR/hydration import issues
                const mod = await import("@/lib/firebaseClient");
                // Call the helper; it already checks isSignInWithEmailLink internally
                await mod.completeMagicLink();
            } catch (err) {
                // Don’t crash the app if link completion fails; log for debugging
                console.error("[MagicLink] completion failed:", err);
            }
        })();
    }, []);

    return null;
}
