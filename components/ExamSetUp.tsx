"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lookups, LookupItem } from "@/lib/dal/types";

export default function ExamSetUp() {
  const router = useRouter();
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoTitleRef = useRef("");
  const titleSpanRef = useRef<HTMLSpanElement>(null);
  const [titleTruncated, setTitleTruncated] = useState(false);

  useEffect(() => {
    if (!lookups) return;
    if (title !== "" && title !== autoTitleRef.current) return;

    const levelPart = lookups.levels
      .filter((l) => selectedLevels.includes(l.id))
      .map((l) => l.displayText.slice(0, 3).replace(/\s+/g, ""))
      .join("_");
    const wrappedLevel = levelPart ? `(${levelPart})` : "";

    const topicPart = lookups.topics
      .filter((t) => selectedTopics.includes(t.id))
      .map((t) => t.displayText.slice(0, 4).replace(/\s+/g, ""))
      .join("_");

    const generated = [topicPart, wrappedLevel].filter(Boolean).join("_");
    autoTitleRef.current = generated;
    setTitle(generated);
  }, [selectedLevels, selectedTopics, lookups]);

  useEffect(() => {
    const el = titleSpanRef.current;
    if (el) setTitleTruncated(el.scrollWidth > el.offsetWidth);
  }, [title]);

  useEffect(() => {
    fetch("/api/lookups")
      .then((r) => r.json())
      .then(setLookups)
      .catch(() => setError("Failed to load options"));
  }, []);

  function toggleItem(id: number, list: number[], setList: (v: number[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleStart() {
    setError(null);
    if (!title.trim()) { setError("Title is required"); return; }
    if (questionCount < 1) { setError("Question count must be at least 1"); return; }
    if (!selectedLevels.length) { setError("Select at least one level"); return; }
    if (!selectedTopics.length) { setError("Select at least one topic"); return; }
    if (!selectedTypes.length) { setError("Select at least one question type"); return; }

    setLoading(true);
    const res = await fetch("/api/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        questionCount,
        levelIds: selectedLevels,
        topicIds: selectedTopics,
        questionTypeIds: selectedTypes,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create exam");
      return;
    }
    router.push(`/exam/${data.examId}`);
  }

  if (!lookups) return <div className="text-neutral-400 text-sm">Loading...</div>;

  const summary = buildSummary(lookups, selectedTypes, selectedTopics, selectedLevels);

  return (
    <div className="bg-card rounded-xl shadow border border-neutral-200 px-4 py-3 flex flex-col gap-2">
      <div className="flex flex-row flex-wrap items-center gap-3 justify-between">
        <span
          ref={titleSpanRef}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 w-60 bg-neutral-50 truncate block"
          title={titleTruncated ? title : undefined}
        >
          {title || <span className="text-neutral-400">Exam title</span>}
        </span>

        <input
          type="number"
          min={1}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-400 w-16"
          value={questionCount}
          onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
          title="Question count"
        />

        <MultiSelect label="Topic" items={lookups.topics} selected={selectedTopics}
          onToggle={(id) => toggleItem(id, selectedTopics, setSelectedTopics)} />

        <MultiSelect label="Level" items={lookups.levels} selected={selectedLevels}
          onToggle={(id) => toggleItem(id, selectedLevels, setSelectedLevels)} />

        <MultiSelect label="Type" items={lookups.questionTypes} selected={selectedTypes}
          onToggle={(id) => toggleItem(id, selectedTypes, setSelectedTypes)} />

        <div className="flex items-center gap-3 ml-auto">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={handleStart}
            disabled={loading || !title.trim() || questionCount < 1 || !selectedLevels.length || !selectedTopics.length || !selectedTypes.length}
            className="text-sm text-brand-600 hover:text-brand-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium border border-brand-300 rounded-lg px-3 py-1.5 hover:bg-brand-50"
          >
            {loading ? "Creating…" : "Start Exam"}
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500 italic min-h-[1rem]">{summary}</p>
    </div>
  );
}

function joinList(items: string[]): string {
  if (items.length === 0) return "___";
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function buildSummary(
  lookups: Lookups,
  _selectedTypes: number[],
  selectedTopics: number[],
  selectedLevels: number[],
): string | null {
  if (!selectedTopics.length && !selectedLevels.length) return null;

  const topicNames = lookups.topics.filter((t) => selectedTopics.includes(t.id)).map((t) => t.displayText);
  const levelNames = lookups.levels.filter((l) => selectedLevels.includes(l.id)).map((l) => l.displayText);
  const levelSuffix = levelNames.length === 1 ? "level" : "levels";

  return `This will test ${joinList(topicNames)} at a ${joinList(levelNames)} ${levelSuffix}.`;
}

function MultiSelect({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: LookupItem[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const summary = selected.length === 0
    ? label
    : selected.length === items.length
      ? `${label}: All`
      : `${label}: ${selected.length}`;

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef} onBlur={handleBlur}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 bg-card hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-400 flex items-center gap-1.5 cursor-pointer"
      >
        {summary}
        <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 left-0 z-20 bg-card border border-neutral-200 rounded-lg shadow-md p-2 flex flex-col gap-1 min-w-max"
          onMouseDown={(e) => e.preventDefault()}
        >
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm text-neutral-800 cursor-pointer px-1 py-0.5 rounded hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="rounded"
              />
              {item.displayText}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
