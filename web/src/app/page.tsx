"use client";
import { signInWithGoogle, sendMagicLink, auth } from "@/lib/firebaseClient";
import { useState } from "react";
export default function Home() {
    const [email, setEmail] = useState("");
    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">HMB‑VTC</h1>
            <div className="flex flex-wrap gap-3">
                <button className="px-3 py-2 rounded bg-black text-white" onClick={() => signInWithGoogle()}>Sign in with Google</button>
                <form onSubmit={async e => {
                    e.preventDefault(); await
                        sendMagicLink(email); alert("Magic link sent");
                }} className="flex gap-2">
                    <input className="border px-2 py-1 rounded" value={email}
                        onChange={e => setEmail(e.target.value)} placeholder="you@uw.edu" />
                    <button className="px-3 py-2 rounded bg-blue-600 text-white">Send
                        magic link</button>
                </form>
            </div>
            {auth.currentUser && (
                <div className="text-sm">Signed in as {auth.currentUser.email}</div>
            )}
            <ul className="list-disc pl-6 space-y-1">
                <li><a className="text-blue-700 underline" href="/admin/settings">Admin
                    Settings</a></li>
                <li><a className="text-blue-700 underline" href="/admin/stations">Admin
                    Stations</a></li>
                <li><a className="text-blue-700 underline" href="/admin/approvals">Admin Approvals</a></li>
                <li><a className="text-blue-700 underline" href="/evaluate">Evaluator
                    Panel</a></li>
            </ul>
        </main>
    );
}