"use client";

import { useEffect, useRef, useState } from "react";
import type { LookupItem } from "@/lib/dal/types";
import GenerateQuestionsModal from "@/components/GenerateQuestionsModal";

export default function AppActions() {
  const [open, setOpen] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [existingTopics, setExistingTopics] = useState<LookupItem[] | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openTopicModal() {
    setOpen(false);
    setNewTopicName("");
    setTopicError(null);
    setShowTopicModal(true);
    if (!existingTopics) {
      const res = await fetch("/api/lookups");
      const data = (await res.json()) as { topics: LookupItem[] };
      setExistingTopics(data.topics);
    }
  }

  function closeTopicModal() {
    setShowTopicModal(false);
    setNewTopicName("");
    setTopicError(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOpen(false);
    setImporting(true);
    try {
      const text = await file.text();
      const body = JSON.parse(text) as unknown;
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { imported?: number; error?: string };
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

  async function handleCreateTopic() {
    if (!newTopicName.trim()) return;
    setSavingTopic(true);
    setTopicError(null);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayText: newTopicName.trim() }),
      });
      const data = (await res.json()) as { topicId?: number; error?: string };
      if (res.ok) {
        setExistingTopics(null); // force refresh next open
        closeTopicModal();
      } else {
        setTopicError(data.error ?? "Failed to create topic");
      }
    } finally {
      setSavingTopic(false);
    }
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          aria-label="App menu"
          className="border border-neutral-300 rounded-lg p-2 text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
        >
          {importing ? (
            <svg className="animate-spin h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 bg-card border border-neutral-200 rounded-lg shadow-md z-20 min-w-48">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); importRef.current?.click(); }}
              className="block w-full text-left px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 rounded-t-lg cursor-pointer"
            >
              Import Questions
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); setShowGenerateModal(true); }}
              className="block w-full text-left px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 cursor-pointer border-t border-neutral-100"
            >
              Generate Questions
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openTopicModal(); }}
              className="block w-full text-left px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 rounded-b-lg cursor-pointer border-t border-neutral-100"
            >
              Create New Topic
            </button>
          </div>
        )}

        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {showTopicModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { e.stopPropagation(); closeTopicModal(); }}
        >
          <div
            className="bg-card rounded-xl border border-neutral-200 shadow-lg w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-neutral-800 mb-4">Create New Topic</h2>

            <form onSubmit={(e) => { e.preventDefault(); void handleCreateTopic(); }} className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-neutral-700">Topic name</label>
                <input
                  autoFocus
                  value={newTopicName}
                  onChange={(e) => { setNewTopicName(e.target.value); setTopicError(null); }}
                  placeholder="e.g. React Hooks"
                  className="text-sm border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 bg-surface placeholder-gray-400"
                />
                {topicError && (
                  <p className="text-xs text-incorrect-500">{topicError}</p>
                )}
              </div>

              {existingTopics === null ? (
                <p className="text-xs text-neutral-400">Loading existing topics...</p>
              ) : existingTopics.length > 0 ? (
                <div className="grid gap-1.5">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Existing topics</p>
                  <ul className="max-h-40 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                    {existingTopics.map((t) => (
                      <li key={t.id} className="px-3 py-1.5 text-sm text-neutral-600">
                        {t.displayText}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeTopicModal}
                  className="text-sm border border-neutral-300 rounded-lg px-4 py-2 text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTopic || !newTopicName.trim()}
                  className="text-sm bg-neutral-800 text-white rounded-lg px-4 py-2 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {savingTopic ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GenerateQuestionsModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </>
  );
}
