"use client";

import { useState } from "react";
import type { Lookups } from "@/lib/dal/types";
import { buildQuestionPrompt } from "@/lib/prompt-builder";

const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 20;

type Props = {
  lookups: Lookups;
  onGenerated: () => void;
};

export default function GenerateQuestionsCard({ lookups, onGenerated }: Props) {
  /* Empty means "use the first topic", so a newly loaded or refreshed topic
     list never leaves the select pointing at nothing. */
  const [chosenTopic, setChosenTopic] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [count, setCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const topic = chosenTopic || (lookups.topics[0]?.displayText ?? "");

  /* Read-only and derived during render: the prompt is a pure function of
     the parameters above, so there's no state to keep in sync. */
  const promptText =
    !topic && levels.length === 0 && questionTypes.length === 0
      ? ""
      : buildQuestionPrompt({ topic, levels, questionTypes, count });

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

  function handleTopicChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setChosenTopic(e.target.value);
  }

  function handleCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    // The input's min/max only limit the spinner arrows; typed values
    // (e.g. "50") get through, so clamp here as well.
    const typedCount = parseInt(e.target.value, 10) || MIN_QUESTION_COUNT;
    const clampedCount = Math.min(
      MAX_QUESTION_COUNT,
      Math.max(MIN_QUESTION_COUNT, typedCount)
    );
    setCount(clampedCount);
  }

  function startOver() {
    setSuccessCount(null);
    setError(null);
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
        onGenerated();
      } else {
        setError(data.error ?? "Generation failed");
      }
    } catch {
      setError("Unexpected error — please try again");
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate =
    !generating &&
    !!promptText.trim() &&
    levels.length > 0 &&
    questionTypes.length > 0;

  // #region Tailwind utility consts
  const cardCls =
    "bg-card rounded-xl shadow border border-neutral-200 p-6 grid gap-4";
  const cardTitleCls = "text-base font-semibold text-neutral-800";
  const successWrapperCls = "grid justify-items-center gap-4 py-8";
  const successIconCls = "text-success-600";
  const successTextCls = "text-sm font-medium text-neutral-700";
  const startOverBtnCls =
    "text-sm border border-neutral-300 rounded-lg px-4 py-2 " +
    "text-neutral-600 hover:bg-neutral-50 transition cursor-pointer";
  const generatingWrapperCls = "grid justify-items-center gap-2 py-8";
  const spinnerCls = "animate-spin h-8 w-8 text-neutral-400";
  const generatingTextCls = "text-sm font-medium text-neutral-600";
  const generatingSubtextCls = "text-xs text-neutral-500";
  // Settings left, prompt right; stacks to one column below lg.
  const formGridCls =
    "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]";
  const settingsColumnCls = "grid gap-4 content-start";
  // Label row sized to content, textarea row stretches to the column height.
  const promptColumnCls = "grid gap-2 grid-rows-[auto_1fr]";
  const fieldGroupCls = "grid gap-2";
  const fieldLabelCls = "text-sm font-medium text-neutral-700";
  const topicSelectCls =
    "text-sm border border-neutral-300 rounded-lg px-3 py-2 " +
    "text-neutral-800 bg-surface cursor-pointer";
  const checkboxGroupCls = "grid grid-flow-col auto-cols-max gap-4";
  const checkboxLabelCls =
    "grid grid-flow-col auto-cols-max items-center gap-2 " +
    "text-sm text-neutral-700 cursor-pointer";
  const checkboxInputCls = "cursor-pointer";
  const countInputCls =
    "text-sm border border-neutral-300 rounded-lg px-3 py-2 " +
    "text-neutral-800 bg-surface w-24";
  // Muted fill signals read-only; the text stays selectable for copying.
  const promptTextareaCls =
    "text-sm border border-neutral-300 rounded-lg px-3 py-2 " +
    "text-neutral-800 bg-neutral-100 font-mono resize-y " +
    "placeholder-neutral-500 focus:outline-none";
  const errorTextCls = "text-xs text-danger-600";
  const footerRowCls = "grid grid-cols-[1fr_auto] items-center gap-4";
  const infoTextCls = "text-xs text-neutral-500";
  const generateBtnCls =
    "text-sm font-semibold bg-primary-fill text-primary-foreground " +
    "rounded-lg px-4 py-2 hover:bg-primary-fill-hover " +
    "disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer";
  // #endregion

  if (successCount !== null) {
    const noun = successCount === 1 ? "question" : "questions";
    return (
      <section className={cardCls}>
        <h2 className={cardTitleCls}>Generate Questions</h2>
        <div className={successWrapperCls}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={successIconCls}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <p className={successTextCls}>
            Successfully generated {successCount} {noun}
          </p>
          <button type="button" onClick={startOver} className={startOverBtnCls}>
            Generate more
          </button>
        </div>
      </section>
    );
  }

  if (generating) {
    return (
      <section className={cardCls}>
        <h2 className={cardTitleCls}>Generate Questions</h2>
        <div className={generatingWrapperCls}>
          <svg className={spinnerCls} viewBox="0 0 24 24" fill="none">
            <circle
              opacity="0.25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              opacity="0.75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className={generatingTextCls}>Generating with AI...</p>
          <p className={generatingSubtextCls}>
            This usually takes 15–30 seconds
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={cardCls}>
      <h2 className={cardTitleCls}>Generate Questions</h2>

      <div className={formGridCls}>
        <div className={settingsColumnCls}>
          <div className={fieldGroupCls}>
            <label htmlFor="generate-topic" className={fieldLabelCls}>
              Topic
            </label>
            <select
              id="generate-topic"
              value={topic}
              onChange={handleTopicChange}
              className={topicSelectCls}
            >
              {lookups.topics.map((t) => (
                <option key={t.id} value={t.displayText}>
                  {t.displayText}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldGroupCls}>
            <span className={fieldLabelCls}>Levels</span>
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
            <span className={fieldLabelCls}>Question Types</span>
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
            <label htmlFor="generate-count" className={fieldLabelCls}>
              Count (max {MAX_QUESTION_COUNT})
            </label>
            <input
              id="generate-count"
              type="number"
              min={MIN_QUESTION_COUNT}
              max={MAX_QUESTION_COUNT}
              value={count}
              onChange={handleCountChange}
              className={countInputCls}
            />
          </div>

          {error && <p className={errorTextCls}>{error}</p>}

          <div className={footerRowCls}>
            <p className={infoTextCls}>AI generation may take 15–30 seconds</p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={generateBtnCls}
            >
              Generate
            </button>
          </div>
        </div>

        <div className={promptColumnCls}>
          <label htmlFor="generate-prompt" className={fieldLabelCls}>
            Prompt
          </label>
          <textarea
            id="generate-prompt"
            rows={12}
            value={promptText}
            readOnly
            className={promptTextareaCls}
            placeholder="Choose levels and question types to build the prompt"
          />
        </div>
      </div>
    </section>
  );
}
