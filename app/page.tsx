"use client";

import { useRef, useState } from "react";
import ExamSetUp from "@/components/ExamSetUp";
import ExamResults from "@/components/ExamResults";
import SkillsRating from "@/components/SkillsRating";

export default function HomePage() {
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Imported ${data.imported} question(s)`);
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-surface p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">Skill Training</h1>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {importing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-neutral-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Importing...
              </span>
            ) : (
              "Import Questions (JSON)"
            )}
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        <div className="flex flex-col gap-6">
          <ExamSetUp />
          <ExamResults />
          <SkillsRating />
        </div>
      </div>
    </main>
  );
}
