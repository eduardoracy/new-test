"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { fn } from "@/lib/functions";
export default function SessionsTable() {
    const [rows, setRows] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    async function refresh() {
        const snap = await getDocs(query(collection(db, "sessions"),
            orderBy("start", "desc")));
        setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    useEffect(() => { refresh(); }, []);
    async function create() {
        await fn.adminCreateSession({ title, start, end });
        setTitle(""); setStart(""); setEnd("");
        await refresh();
    }
    return (
        <div className="space-y-3">
            <div className="flex gap-2 items-end">
                <div>
                    <label className="block text-sm">Title</label>
                    <input className="border rounded px-2 py-1" value={title}
                        onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm">Start</label>
                    <input className="border rounded px-2 py-1" type="datetime-local"
                        value={start} onChange={e => setStart(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm">End</label>
                    <input className="border rounded px-2 py-1" type="datetime-local"
                        value={end} onChange={e => setEnd(e.target.value)} />
                </div>
                <button onClick={create} className="px-3 py-2 rounded bg-green-600 text-white">Create session</button>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left border-b"><th className="py-2">Title</
                    th><th>Start</th><th>End</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.id} className="border-b">
                            <td className="py-2">{r.title}</td>
                            <td>{(r.start as Timestamp).toDate().toLocaleString()}</td>
                            <td>{(r.end as Timestamp).toDate().toLocaleString()}</td>
                            <td>{r.canceled ? "Canceled" : (Date.now() < (r.start as
                                Timestamp).toMillis() ? "Scheduled" : (Date.now() > (r.end as
                                    Timestamp).toMillis() ? "Ended" : "Live"))}</td>
                            <td>
                                {!r.canceled && <button className="text-red-600"
                                    onClick={async () => {
                                        await fn.adminCancelSession({ sessionId: r.id }); await
                                            refresh();
                                    }}>Cancel</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}