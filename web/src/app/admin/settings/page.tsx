"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { AppConfigSchema } from "@/lib/zodSchemas";
import { fn } from "@/lib/functions";
import SessionsTable from "@/components/SessionsTable";
import StationOverrideTable from "@/components/StationOverrideTable";
export default function AdminSettingsPage() {
    const [cfg, setCfg] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        (async () => {
            const snap = await getDoc(doc(db, "config/app"));
            const init = AppConfigSchema.parse({ ...(snap.data() || {}) });
            setCfg(init);
        })();
    }, []);
    if (!cfg) return <div>Loading settings…</div>;
    async function save() {
        setSaving(true);
        await fn.adminUpdateConfig(cfg);
        setSaving(false);
        alert("Settings saved");
    }
    return (
        <main className="space-y-8">
            <h1 className="text-2xl font-bold">Admin Settings</h1>
            <section className="rounded-xl border bg-white p-4 space-y-4">
                <h2 className="text-lg font-semibold">Evaluation & Privacy</h2>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={cfg.evaluatorCanSeeLatest}
                        onChange={e => setCfg({
                            ...cfg, evaluatorCanSeeLatest:
                                e.target.checked
                        })} />
                    <span>Show latest score to evaluators</span>
                </label>
                <div>
                    <label className="block text-sm">Default time gap (minutes)</label>
                    <input className="border px-2 py-1 rounded" type="number" min={0}
                        max={240}
                        value={cfg.minAttemptGapMinutesDefault}
                        onChange={e => setCfg({
                            ...cfg, minAttemptGapMinutesDefault:
                                Number(e.target.value)
                        })} />
                </div>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={cfg.forceSubmitReasonRequired}
                        onChange={e => setCfg({
                            ...cfg, forceSubmitReasonRequired:
                                e.target.checked
                        })} />
                    <span>Reason required for force submit</span>
                </label>
            </section>
            <section className="rounded-xl border bg-white p-4 space-y-4">
                <h2 className="text-lg font-semibold">Evaluation Gate</h2>
                <div className="flex items-center gap-2">
                    <label>Manual state</label>
                    <select className="border rounded px-2 py-1"
                        value={cfg.evaluationGate.manualState}
                        onChange={e => setCfg({
                            ...cfg, evaluationGate:
                                { ...cfg.evaluationGate, manualState: e.target.value as any }
                        })}>
                        <option value="neutral">Neutral</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={cfg.evaluationGate.requireSessions}
                        onChange={e => setCfg({
                            ...cfg, evaluationGate:
                                { ...cfg.evaluationGate, requireSessions: e.target.checked }
                        })} />
                    <span>Require session windows</span>
                </label>
                <div>
                    <label className="block text-sm">Offline grace (minutes)</label>
                    <input className="border px-2 py-1 rounded" type="number" min={0}
                        max={60}
                        value={cfg.evaluationGate.graceLateSubmitMinutes}
                        onChange={e => setCfg({
                            ...cfg, evaluationGate:
                                { ...cfg.evaluationGate, graceLateSubmitMinutes: Number(e.target.value) }
                        })} />
                </div>
                <SessionsTable />
            </section>
            <section className="rounded-xl border bg-white p-4">
                <h2 className="text-lg font-semibold">Per‑station time‑gap overrides</
                h2>
                <StationOverrideTable />
            </section>
            <div>
                <button disabled={saving} onClick={save} className="px-3 py-2 rounded bg-blue-600 text-white">
                    {saving ? "Saving…" : "Save changes"}
                </button>
            </div>
        </main>
    );
}