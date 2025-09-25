"use client";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { fn } from "@/lib/functions";
/**
* Admin Approvals – live list of pending_approval attempts with bulk approve.
*/
export default function AdminApprovalsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    useEffect(() => {
        const q = query(
            collection(db, "attempts"),
            where("status", "==", "pending_approval"),
            orderBy("createdAt", "desc"),
            limit(200)
        );
        const unsub = onSnapshot(q, (snap) => {
            setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setSelected({});
        });
        return () => unsub();
    }, []);
    const allChecked = useMemo(() => rows.length > 0 && rows.every(r =>
        selected[r.id]), [rows, selected]);
    function toggleAll() {
        if (allChecked) return setSelected({});
        const next: Record<string, boolean> = {};
        rows.forEach(r => next[r.id] = true);
        setSelected(next);
    }
    async function approveSelected() {
        const attemptIds = Object.keys(selected).filter(id => selected[id]);
        if (attemptIds.length === 0) return alert("No rows selected");
        await fn.approveAttempts({ attemptIds });
    }
    return (
        <main className="space-y-4">
            <h1 className="text-2xl font-bold">Approvals</h1>
            <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded bg-green-600 text-white"
                    onClick={approveSelected}>Approve selected</button>
                <span className="text-sm text-neutral-600">{Object.values(selected).filter(Boolean).length} selected</span>
            </div>
            <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-2 px-2"><input type="checkbox"
                                checked={allChecked} onChange={toggleAll} /></th>
                            <th className="py-2 px-2">Created</th>
                            <th className="py-2 px-2">Member</th>
                            <th className="py-2 px-2">Station</th>
                            <th className="py-2 px-2">Overall</th>
                            <th className="py-2 px-2">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.id} className="border-b">
                                <td className="py-2 px-2"><input type="checkbox" checked={!!
                                    selected[r.id]} onChange={e => setSelected({
                                        ...selected, [r.id]:
                                            e.target.checked
                                    })} /></td>
                                <td className="py-2 px-2">{r.createdAt?.toDate?.
                                    ().toLocaleString?.() || "—"}</td>
                                <td className="py-2 px-2">{r.memberUid}</td>
                                <td className="py-2 px-2">{r.stationId}</td>
                                <td className="py-2 px-2">{r.overallScore}</td>
                                <td className="py-2 px-2">{r.reasonIfPending ||
                                    r.gateDecision?.reason || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}