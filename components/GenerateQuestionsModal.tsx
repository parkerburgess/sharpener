"use client";

import { useEffect, useState } from "react";
import type { Lookups } from "@/lib/dal/types";
import { buildQuestionPrompt } from "@/lib/prompt-builder";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function GenerateQuestionsModal({ open, onClose }: Props) {
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [topic, setTopic] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [count, setCount] = useState(6);
  const [promptText, setPromptText] = useState("");
  const [userEditedPrompt, setUserEditedPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (lookups) return;
    fetch("/api/lookups")
      .then((r) => r.json())
      .then((data: Lookups) => {
        setLookups(data);
        if (data.topics.length > 0) setTopic(data.topics[0].displayText);
      });
  }, [open]);

  // Auto-rebuild prompt when params change, unless user has manually edited it
  useEffect(() => {
    if (userEditedPrompt) return;
    if (!topic && levels.length === 0 && questionTypes.length === 0) return;
    setPromptText(buildQuestionPrompt({ topic, levels, questionTypes, count }));
  }, [topic, levels, questionTypes, count, userEditedPrompt]);

  function toggleLevel(text: string) {
    setLevels((prev) =>
      prev.includes(text) ? prev.filter((l) => l !== text) : [...prev, text]
    );
  }

  function toggleType(text: string) {
    setQuestionTypes((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  }

  function handleBackdropClick(e: React.MouseEvent) {
    e.stopPropagation();
    handleClose();
  }

  function handlePromptChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setPromptText(e.target.value);
    setUserEditedPrompt(true);
  }

  function resetPrompt() {
    setUserEditedPrompt(false);
    setPromptText(buildQuestionPrompt({ topic, levels, questionTypes, count }));
  }

  function handleClose() {
    if (generating) return;
    setSuccessCount(null);
    onClose();
  }

  async function handleGenerate() {
    if (!promptText.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = (await res.json()) as { imported?: number; error?: string };
      if (res.ok) {
        setSuccessCount(data.imported ?? 0);
        setGenerating(false);
      } else {
        setError(data.error ?? "Generation failed");
        setGenerating(false);
      }
    } catch {
      setError("Unexpected error — please try again");
      setGenerating(false);
    }
  }

  const canGenerate = !!promptText.trim() && levels.length > 0 && questionTypes.length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-card rounded-xl border border-neutral-200 shadow-lg w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-neutral-800 mb-5">Generate Questions</h2>

        {successCount !== null ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-correct-600">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <p className="text-sm font-medium text-neutral-700">
              Successfully generated {successCount} question{successCount !== 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 text-sm border border-neutral-300 rounded-lg px-5 py-2 text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : generating ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <svg className="animate-spin h-8 w-8 text-neutral-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm font-medium text-neutral-600">Generating with AI...</p>
            <p className="text-xs text-neutral-400">This usually takes 15–30 seconds</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {!lookups ? (
              <p className="text-sm text-neutral-400">Loading...</p>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-neutral-700">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-sm border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 bg-surface cursor-pointer"
                  >
                    {lookups.topics.map((t) => (
                      <option key={t.id} value={t.displayText}>{t.displayText}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-neutral-700">Levels</label>
                  <div className="flex flex-wrap gap-3">
                    {lookups.levels.map((l) => (
                      <label key={l.id} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={levels.includes(l.displayText)}
                          onChange={() => toggleLevel(l.displayText)}
                          className="cursor-pointer"
                        />
                        {l.displayText}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-neutral-700">Question Types</label>
                  <div className="flex flex-wrap gap-3">
                    {lookups.questionTypes.map((qt) => (
                      <label key={qt.id} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={questionTypes.includes(qt.displayText)}
                          onChange={() => toggleType(qt.displayText)}
                          className="cursor-pointer"
                        />
                        {qt.displayText}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-neutral-700">Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="text-sm border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 bg-surface w-24"
                  />
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700">Prompt</label>
                    {userEditedPrompt && (
                      <button
                        type="button"
                        onClick={resetPrompt}
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                      >
                        Reset prompt
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={promptText}
                    onChange={handlePromptChange}
                    className="text-sm border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 bg-surface font-mono resize-y placeholder-gray-400"
                    placeholder="Select parameters above to generate the prompt"
                  />
                </div>

                {error && (
                  <p className="text-xs text-incorrect-500">{error}</p>
                )}

                <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  AI generation may take 15–30 seconds
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-sm border border-neutral-300 rounded-lg px-4 py-2 text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="text-sm bg-neutral-800 text-white rounded-lg px-4 py-2 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Generate
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
