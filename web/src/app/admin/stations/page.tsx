"use client";
import { useEffect, useMemo, useState } from "react";
import { collection, addDoc, doc, getDocs, orderBy, query, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { fn } from "@/lib/functions";
import StationForm, { StationInput } from "@/components/StationForm";
/**
* Stations admin page – list/create/edit/delete + reorder via up/down and bulk
save.
*/
export default function AdminStationsPage() {
    const [stations, setStations] = useState<any[]>([]);
    const [editing, setEditing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);
    async function refresh() {
        const snap = await getDocs(query(collection(db, "stations"),
            orderBy("order", "asc")));
        setStations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    useEffect(() => { refresh(); }, []);
    function move(id: string, dir: -1 | 1) {
        const idx = stations.findIndex(s => s.id === id);
        if (idx < 0) return;
        const j = idx + dir;
        if (j < 0 || j >= stations.length) return;
        const next = stations.slice();
        const tmp = next[idx]; next[idx] = next[j]; next[j] = tmp;
        setStations(next);
    }
    async function saveOrder() {
        const map: Record<string, number> = {};
        stations.forEach((s, i) => { map[s.id] = i + 1; });
        await fn.reorderStations({ orders: map });
        await refresh();
    }
    async function onCreate(input: StationInput) {
        // Assign next order index
        const order = (stations[stations.length - 1]?.order || 0) + 1;
        const ref = doc(collection(db, "stations"));
        await setDoc(ref, {
            name: input.name, order, isActive: true, categories:
                input.categories, updatedAt: new Date()
        });
        setCreating(false); await refresh();
    }
    async function onUpdate(id: string, input: StationInput) {
        await setDoc(doc(db, "stations", id), {
            name: input.name, isActive:
                input.isActive, categories: input.categories, updatedAt: new Date()
        }, {
            merge:
                true
        });
        setEditing(null); await refresh();
    }
    async function onDelete(id: string) {
        if (!confirm("Delete this station?")) return;
        await deleteDoc(doc(db, "stations", id));
        await refresh();
    }
    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">Stations</h1>
            <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded bg-blue-600 text-white"
                    onClick={() => setCreating(true)}>New station</button>
                <button className="px-3 py-2 rounded border" onClick={saveOrder}>Save
                    order</button>
            </div>
            <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b"><th className="py-2 px-2">Order</
                        th><th className="py-2 px-2">Name</th><th className="py-2 px-2">Active</th><th
                            className="py-2 px-2">Actions</th></tr>
                    </thead>
                    <tbody>
                        {stations.map((s, i) => (
                            <tr key={s.id} className="border-b">
                                <td className="py-2 px-2 whitespace-nowrap">{i + 1}
                                    <button className="ml-2 px-1 border rounded"
                                        onClick={() => move(s.id, -1)}>↑</button>
                                    <button className="ml-1 px-1 border rounded"
                                        onClick={() => move(s.id, +1)}>↓</button>
                                </td>
                                <td className="py-2 px-2">{s.name}</td>
                                <td className="py-2 px-2">{String(s.isActive)}</td>
                                <td className="py-2 px-2 space-x-2">
                                    <button className="px-2 py-1 rounded border"
                                        onClick={() => setEditing(s)}>Edit</button>
                                    <button className="px-2 py-1 rounded border text-red-600"
                                        onClick={() => onDelete(s.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {creating && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-4 w-full max-w-2xl">
                        <h2 className="text-lg font-semibold mb-3">New Station</h2>
                        <StationForm onCancel={() => setCreating(false)} onSubmit={onCreate} /
                        >
                    </div>
                </div>
            )}
            {editing && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-4 w-full max-w-2xl">
                        <h2 className="text-lg font-semibold mb-3">Edit Station</h2>
                        <StationForm initial={{
                            name: editing.name,
                            isActive: editing.isActive,
                            categories: editing.categories,
                        }} onCancel={() => setEditing(null)}
                            onSubmit={(input) => onUpdate(editing.id, input)} />
                    </div>
                </div>
            )}
        </main>
    );
}