import { useState } from "react";
import type { Score } from "@/lib/types";
export default function RubricCategory({ id, label, rubric, value, onChange }: {
    id: string;
    label: string;
    rubric: { Developing: string; Proficient: string; Mastery: string };
    value: Score | undefined;
    onChange: (s: Score) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border rounded p-3">
            <div className="flex items-center justify-between">
                <div className="font-medium">{label}</div>
                <button className="text-sm underline" onClick={() => setOpen(x => !x)}
                >{open ? "Hide rubric" : "See rubric"}</button>
            </div>
            {open && (
                <div className="mt-2 text-sm text-neutral-700 space-y-1">
                    <div><strong>Developing:</strong> {rubric.Developing}</div>
                    <div><strong>Proficient:</strong> {rubric.Proficient}</div>
                    <div><strong>Mastery:</strong> {rubric.Mastery}</div>
                </div>
            )}
            <div className="mt-3 flex gap-3 text-sm">
                {(["Developing", "Proficient", "Mastery"] as Score[]).map(s => (
                    <label key={s} className="flex items-center gap-1">
                        <input type="radio" name={id} checked={value === s}
                            onChange={() => onChange(s)} /> {s}
                    </label>
                ))}
            </div>
        </div>
    );
}