"use client";
import { useState } from "react";
export interface StationInput {
    name: string;
    isActive: boolean;
    categories: {
        id: string; label: string; rubric: {
            Developing: string;
            Proficient: string; Mastery: string
        }
    }[];
}
export default function StationForm({ initial, onSubmit, onCancel }: {
    initial?: Partial<StationInput>;
    onSubmit: (input: StationInput) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initial?.name || "");
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
    const [categories, setCategories] =
        useState<StationInput["categories"]>(initial?.categories || []);
    function addCategory() {
        const n = categories.length + 1;
        setCategories([...categories, {
            id: crypto.randomUUID(), label: `Category $
{n}`, rubric: { Developing: "", Proficient: "", Mastery: "" }
        }]);
    }
    function updateCategory(i: number, patch: Partial<StationInput["categories"][number]>) {
        const next = categories.slice();
        next[i] = { ...next[i], ...patch } as any;
        setCategories(next);
    }
    function updateRubric(i: number, level: "Developing" | "Proficient" | "Mastery",
        text: string) {
        const next = categories.slice();
        next[i] = { ...next[i], rubric: { ...next[i].rubric, [level]: text } } as
            any;
        setCategories(next);
    }
    function removeCategory(i: number) {
        const next = categories.slice(); next.splice(i, 1); setCategories(next);
    }
    function submit() {
        if (!name.trim()) return alert("Name is required");
        if (categories.length === 0) return alert("Add at least one category");
        onSubmit({ name: name.trim(), isActive, categories });
    }
    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm">Name</label>
                    <input className="border rounded px-2 py-1 w-full" value={name}
                        onChange={e => setName(e.target.value)} />
                </div>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isActive}
                        onChange={e => setIsActive(e.target.checked)} /> Active
                </label>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Categories</h3>
                    <button className="px-2 py-1 rounded border" onClick={addCategory}
                    >Add category</button>
                </div>
                {categories.map((c, i) => (
                    <div key={c.id} className="border rounded p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm w-24">Label</label>
                            <input className="border rounded px-2 py-1 w-full"
                                value={c.label} onChange={e => updateCategory(i, { label: e.target.value })} />
                            <button className="px-2 py-1 rounded border text-red-600"
                                onClick={() => removeCategory(i)}>Remove</button>
                        </div>
                        <div>
                            <label className="block text-sm">Developing</label>
                            <textarea className="border rounded px-2 py-1 w-full" rows={2}
                                value={c.rubric.Developing} onChange={e => updateRubric(i, "Developing",
                                    e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm">Proficient</label>
                            <textarea className="border rounded px-2 py-1 w-full" rows={2}
                                value={c.rubric.Proficient} onChange={e => updateRubric(i, "Proficient",
                                    e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm">Mastery</label>
                            <textarea className="border rounded px-2 py-1 w-full" rows={2}
                                value={c.rubric.Mastery} onChange={e => updateRubric(i, "Mastery",
                                    e.target.value)} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded border" onClick={onCancel}>Cancel</
                button>
                <button className="px-3 py-2 rounded bg-blue-600 text-white"
                    onClick={submit}>Save</button>
            </div>
        </div>
    );
}