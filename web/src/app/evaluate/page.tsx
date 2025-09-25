"use client";
import { useState } from "react";
import { fn } from "@/lib/functions";
import QRScanner from "@/components/QRScanner";
/**
* Minimal evaluator flow wired to submitAttempt().
* - Adds QR scan to quickly populate memberUid.
* - Leaves real station/member search & rubric grid to your next pass.
*/
export default function EvaluatePage() {
    const [stationId, setStationId] = useState("");
    const [memberUid, setMemberUid] = useState("");
    const [categories, setCategories] = useState<Record<string,
        "Developing" | "Proficient" | "Mastery">>({});
    const [comment, setComment] = useState("");
    const [force, setForce] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    async function submit() {
        const res: any = await fn.submitAttempt({
            memberUid,
            stationId,
            categories,
            comment,
            forceSubmit: force,
            // Capture client time for offline/grace logic server-side
            attemptedAtClient: new Date().toISOString(),
            clientClockSkewMs: 0,
        });
        alert(`Submitted: ${res.data.status}`);
        setComment(""); setCategories({});
    }
    return (
        <main className="space-y-4">
            <h1 className="text-2xl font-bold">Evaluate</h1>
            <div className="grid md:grid-cols-3 gap-3 items-end">
                <div>
                    <label className="block text-sm">Station ID</label>
                    <input className="border rounded px-2 py-1 w-full" value={stationId}
                        onChange={e => setStationId(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm">Member UID</label>
                    <div className="flex gap-2">
                        <input className="border rounded px-2 py-1 w-full"
                            value={memberUid} onChange={e => setMemberUid(e.target.value)} />
                        <button className="px-2 py-1 rounded border"
                            onClick={() => setShowScanner(true)}>Scan QR</button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2"><input type="checkbox"
                        checked={force} onChange={e => setForce(e.target.checked)} /> Force submit</label>
                    <button className="px-3 py-2 rounded bg-blue-600 text-white"
                        onClick={submit}>Submit</button>
                </div>
            </div>
            {showScanner && (
                <QRScanner onClose={() => setShowScanner(false)} onResult={(payload) => {
// Expect QR to encode JSON: { uid, token } or { userId, qrToken } resolved via CF if you prefer
                    try {
                        const obj = JSON.parse(payload);
                        if (obj.uid) setMemberUid(obj.uid);
                        setShowScanner(false);
                    } catch { /* if plain text, treat as uid */
                        if (payload) setMemberUid(payload);
                        setShowScanner(false);
                    }
                }} />
            )}
            <p className="text-sm text-neutral-600">(Next: hook station & member search, rubric categories with <em>RubricCategory</em>, and time‑gap warning modal.)</p>
        </main>
    );
}