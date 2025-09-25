"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type Row = {
    id: string;
    name: string;
    minutes: number | null; // null = no override (use global default)
    dirty?: boolean;
    saving?: boolean;
};

export default function StationOverrideTable() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingAll, setSavingAll] = useState(false);

    // Load stations and their per-station settings
    useEffect(() => {
        (async () => {
            setLoading(true);
            // 1) read stations in current order
            const stationsSnap = await getDocs(
                query(collection(db, "stations"), orderBy("order", "asc"))
            );
            const base = stationsSnap.docs.map((d) => ({
                id: d.id,
                name: (d.data() as any).name ?? d.id,
                minutes: null as number | null,
            }));

            // 2) for each station, read /config/stations/{id}/settings
            const withSettings = await Promise.all(
                base.map(async (r) => {
                    const settingsRef = doc(db, "config/stations", r.id, "settings");
                    const s = await getDoc(settingsRef);
                    const minutes =
                        s.exists() && typeof (s.data() as any).minAttemptGapMinutes === "number"
                            ? (s.data() as any).minAttemptGapMinutes
                            : null;
                    return { ...r, minutes };
                })
            );

            setRows(withSettings);
            setLoading(false);
        })();
    }, []);

    function updateMinutes(id: string, value: string) {
        setRows((prev) =>
            prev.map((r) =>
                r.id === id
                    ? {
                        ...r,
                        minutes: value === "" ? null : Math.max(0, Math.min(240, Number(value) || 0)),
                        dirty: true,
                    }
                    : r
            )
        );
    }

    async function saveRow(r: Row) {
        const settingsRef = doc(db, "config/stations", r.id, "settings");
        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, saving: true } : x)));
        try {
            if (r.minutes == null) {
                // Clear the override
                await setDoc(settingsRef, { minAttemptGapMinutes: deleteField() }, { merge: true });
            } else {
                // Set/Update override
                await setDoc(settingsRef, { minAttemptGapMinutes: r.minutes }, { merge: true });
            }
            setRows((prev) =>
                prev.map((x) => (x.id === r.id ? { ...x, dirty: false, saving: false } : x))
            );
        } catch (e: any) {
            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, saving: false } : x)));
            alert(e?.message || "Failed to save row");
        }
    }

    async function saveAll() {
        const dirty = rows.filter((r) => r.dirty);
        if (dirty.length === 0) return;
        setSavingAll(true);
        try {
            await Promise.all(dirty.map((r) => saveRow(r)));
        } finally {
            setSavingAll(false);
        }
    }

    if (loading) return <div className="text-sm text-neutral-600">Loading overrides…</div>;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <button
                    onClick={saveAll}
                    className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                    disabled={savingAll || rows.every((r) => !r.dirty)}
                >
                    {savingAll ? "Saving…" : "Save all changes"}
                </button>
                <span className="text-sm text-neutral-600">
                    {rows.filter((r) => r.dirty).length} unsaved
                </span>
            </div>

            <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-2">Station</th>
                            <th className="py-2 px-2">Override minutes</th>
                            <th className="py-2 px-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-b">
                                <td className="py-2 px-2 whitespace-nowrap">{r.name}</td>
                                <td className="py-2 px-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={240}
                                            inputMode="numeric"
                                            className="border px-2 py-1 rounded w-28"
                                            value={r.minutes ?? ""}
                                            placeholder="(use default)"
                                            onChange={(e) => updateMinutes(r.id, e.target.value)}
                                        />
                                        <span className="text-xs text-neutral-500">min</span>
                                    </div>
                                </td>
                                <td className="py-2 px-2 space-x-2">
                                    <button
                                        className="px-2 py-1 rounded border"
                                        onClick={() => saveRow(r)}
                                        disabled={r.saving || !r.dirty}
                                    >
                                        {r.saving ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                        className="px-2 py-1 rounded border text-red-600"
                                        onClick={() => updateMinutes(r.id, "")}
                                        disabled={r.saving}
                                        title="Clear override (use global default)"
                                    >
                                        Clear
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td className="py-3 px-2 text-neutral-500" colSpan={3}>
                                    No stations found. Create stations first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-neutral-600">
                Per-station override is stored at{" "}
                <code className="bg-neutral-100 px-1 rounded">
                    /config/stations/{"{stationId}"}/settings.minAttemptGapMinutes
                </code>
                . Leave blank to use the global default.
            </p>
        </div>
    );
}
