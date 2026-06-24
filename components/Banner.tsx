"use client";

import { useRef, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export default function Banner() {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    <header
      onClick={() => router.push("/")}
      className="w-full h-24 flex-shrink-0 sticky top-0 z-10 bg-surface border-b border-neutral-200 flex items-center cursor-pointer"
    >
      <div className="flex-1 flex items-center pl-6">
        <div className="border border-neutral-300 rounded-lg p-2 text-neutral-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </div>

      <img src="/banner.svg" alt="Sharpener" className="w-1/2 h-full object-cover" />

      <div className="flex-1 flex items-center justify-end px-6 gap-2">
        {mounted && (
          <button
            onClick={(e) => { e.stopPropagation(); setTheme(theme === "dark" ? "light" : "dark"); }}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="border border-neutral-300 rounded-lg px-2 py-1.5 text-neutral-600 hover:bg-neutral-50 transition flex items-center"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); importRef.current?.click(); }}
          disabled={importing}
          className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {importing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
    </header>
  );
}
