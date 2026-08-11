"use client";

import { useEffect, useState } from "react";
import { Modal } from "@parkerburgess/wandering-parker-ui";
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

  // #region Tailwind utility consts
  const modalTitleCls = "text-base font-semibold text-neutral-800 mb-5";
  const successWrapperCls = "flex flex-col items-center gap-4 py-10";
  const successIconCls = "text-correct-600";
  const successTextCls = "text-sm font-medium text-neutral-700";
  const successCloseBtnCls =
    "mt-2 text-sm border border-neutral-300 rounded-lg px-5 py-2 " +
    "text-neutral-600 hover:bg-neutral-50 transition cursor-pointer";
  const generatingWrapperCls = "flex flex-col items-center gap-3 py-10";
  const spinnerCls = "animate-spin h-8 w-8 text-neutral-400";
  const generatingTextCls = "text-sm font-medium text-neutral-600";
  const generatingSubtextCls = "text-xs text-neutral-400";
  const formGridCls = "grid gap-5";
  const loadingTextCls = "text-sm text-neutral-400";
  const fieldGroupCls = "grid gap-1.5";
  const fieldLabelCls = "text-sm font-medium text-neutral-700";
  const topicSelectCls =
    "text-sm border border-neutral-300 rounded-lg px-3 py-2 " +
    "text-neutral-800 bg-surface cursor-pointer";
  const checkboxGroupCls = "flex flex-wrap gap-3";
  const checkboxLabelCls =
    "flex items-center gap-2 text-sm text-neutral-700 cursor-pointer";
  const checkboxInputCls = "cursor-pointer";
  const countInputCls =
    "text-sm border border-neutral-300 rounded-lg px-3 py-2 " +
    "text-neutral-800 bg-surface w-24";
  const promptHeaderCls = "flex items-center justify-between";
  const resetBtnCls =
    "text-xs text-neutral-400 hover:text-neutral-600 transition cursor-pointer";
  const promptTextareaCls =
    "text-sm border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 " +
    "bg-surface font-mono resize-y placeholder-gray-400";
  const errorTextCls = "text-xs text-incorrect-500";
  const infoTextCls = "text-xs text-neutral-400 flex items-center gap-1.5";
  const actionsRowCls = "flex justify-end gap-2";
  const cancelBtnCls =
    "text-sm border border-neutral-300 rounded-lg px-4 py-2 " +
    "text-neutral-600 hover:bg-neutral-50 transition cursor-pointer";
  const generateBtnCls =
    "text-sm bg-neutral-800 text-white rounded-lg px-4 py-2 " +
    "hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed " +
    "transition cursor-pointer";
  // #endregion

  if (!open) return null;

  const canGenerate = !!promptText.trim() && levels.length > 0 && questionTypes.length > 0;

  return (
    <Modal onClose={handleClose} size="lg">
      <h2 className={modalTitleCls}>Generate Questions</h2>

        {successCount !== null ? (
          <div className={successWrapperCls}>
            <svg
              width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              className={successIconCls}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <p className={successTextCls}>
              Successfully generated {successCount} question{successCount !== 1 ? "s" : ""}
            </p>
            <button type="button" onClick={handleClose} className={successCloseBtnCls}>
              Close
            </button>
          </div>
        ) : generating ? (
          <div className={generatingWrapperCls}>
            <svg className={spinnerCls} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className={generatingTextCls}>Generating with AI...</p>
            <p className={generatingSubtextCls}>This usually takes 15–30 seconds</p>
          </div>
        ) : (
          <div className={formGridCls}>
            {!lookups ? (
              <p className={loadingTextCls}>Loading...</p>
            ) : (
              <>
                <div className={fieldGroupCls}>
                  <label className={fieldLabelCls}>Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={topicSelectCls}
                  >
                    {lookups.topics.map((t) => (
                      <option key={t.id} value={t.displayText}>{t.displayText}</option>
                    ))}
                  </select>
                </div>

                <div className={fieldGroupCls}>
                  <label className={fieldLabelCls}>Levels</label>
                  <div className={checkboxGroupCls}>
                    {lookups.levels.map((l) => (
                      <label key={l.id} className={checkboxLabelCls}>
                        <input
                          type="checkbox"
                          checked={levels.includes(l.displayText)}
                          onChange={() => toggleLevel(l.displayText)}
                          className={checkboxInputCls}
                        />
                        {l.displayText}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={fieldGroupCls}>
                  <label className={fieldLabelCls}>Question Types</label>
                  <div className={checkboxGroupCls}>
                    {lookups.questionTypes.map((qt) => (
                      <label key={qt.id} className={checkboxLabelCls}>
                        <input
                          type="checkbox"
                          checked={questionTypes.includes(qt.displayText)}
                          onChange={() => toggleType(qt.displayText)}
                          className={checkboxInputCls}
                        />
                        {qt.displayText}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={fieldGroupCls}>
                  <label className={fieldLabelCls}>Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className={countInputCls}
                  />
                </div>

                <div className={fieldGroupCls}>
                  <div className={promptHeaderCls}>
                    <label className={fieldLabelCls}>Prompt</label>
                    {userEditedPrompt && (
                      <button type="button" onClick={resetPrompt} className={resetBtnCls}>
                        Reset prompt
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={promptText}
                    onChange={handlePromptChange}
                    className={promptTextareaCls}
                    placeholder="Select parameters above to generate the prompt"
                  />
                </div>

                {error && <p className={errorTextCls}>{error}</p>}

                <p className={infoTextCls}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  AI generation may take 15–30 seconds
                </p>

                <div className={actionsRowCls}>
                  <button
                    type="button"
                    onClick={handleClose}
                    className={cancelBtnCls}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={generateBtnCls}
                  >
                    Generate
                  </button>
                </div>
              </>
            )}
          </div>
        )}
    </Modal>
  );
}
