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

    const topicPart = lookups.topics
      .filter((t) => selectedTopics.includes(t.id))
      .map((t) => t.displayText)
      .join("_");

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const datePart = `${dd}/${mm}`;

    const generated = [topicPart, datePart].filter(Boolean).join("_");
    autoTitleRef.current = generated;
    setTitle(generated);
  }, [selectedTopics, lookups]);

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

  // #region Tailwind utility consts
  const loadingCls = "text-neutral-400 text-sm";
  const wrapperCls =
    "bg-card rounded-xl shadow border border-neutral-200 px-4 py-3 flex flex-col gap-2";
  const formRowCls = "flex flex-row flex-wrap items-center gap-3 justify-between";
  const titleSpanCls =
    "border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 " +
    "w-60 bg-neutral-50 truncate block";
  const questionCountInputCls =
    "border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 " +
    "focus:outline-none focus:ring-2 focus:ring-primary-400 w-16";
  const actionRowCls = "flex items-center gap-3 ml-auto";
  const errorTextCls = "text-red-500 text-xs";
  const startBtnCls =
    "text-sm font-medium cursor-pointer transition " +
    "text-primary-600 hover:text-primary-800 hover:bg-primary-50 " +
    "border border-primary-300 rounded-lg px-3 py-1.5 " +
    "disabled:opacity-40 disabled:cursor-not-allowed";
  const summaryCls = "text-xs text-neutral-500 italic min-h-[1rem]";
  // #endregion

  if (!lookups) return <div className={loadingCls}>Loading...</div>;

  const summary = buildSummary(lookups, selectedTypes, selectedTopics, selectedLevels);

  const isStartDisabled =
    loading ||
    !title.trim() ||
    questionCount < 1 ||
    !selectedLevels.length ||
    !selectedTopics.length ||
    !selectedTypes.length;

  return (
    <div className={wrapperCls}>
      <div className={formRowCls}>
        <span
          ref={titleSpanRef}
          className={titleSpanCls}
          title={titleTruncated ? title : undefined}
        >
          {title || <span className={loadingCls}>Exam title</span>}
        </span>

        <input
          type="number"
          min={1}
          className={questionCountInputCls}
          value={questionCount}
          onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
          title="Question count"
        />

        <MultiSelect
          label="Topic"
          items={lookups.topics}
          selected={selectedTopics}
          onToggle={(id) => toggleItem(id, selectedTopics, setSelectedTopics)}
        />

        <MultiSelect
          label="Level"
          items={lookups.levels}
          selected={selectedLevels}
          onToggle={(id) => toggleItem(id, selectedLevels, setSelectedLevels)}
        />

        <MultiSelect
          label="Type"
          items={lookups.questionTypes}
          selected={selectedTypes}
          onToggle={(id) => toggleItem(id, selectedTypes, setSelectedTypes)}
        />

        <div className={actionRowCls}>
          {error && <p className={errorTextCls}>{error}</p>}
          <button
            onClick={handleStart}
            disabled={isStartDisabled}
            className={startBtnCls}
          >
            {loading ? "Creating…" : "Start Exam"}
          </button>
        </div>
      </div>

      <p className={summaryCls}>{summary}</p>
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

  const topicNames = lookups.topics
    .filter((t) => selectedTopics.includes(t.id))
    .map((t) => t.displayText);
  const levelNames = lookups.levels
    .filter((l) => selectedLevels.includes(l.id))
    .map((l) => l.displayText);
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

  // #region Tailwind utility consts
  const containerCls = "relative";
  const triggerBtnCls =
    "border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 " +
    "bg-card hover:bg-neutral-50 focus:outline-none focus:ring-2 " +
    "focus:ring-primary-400 flex items-center gap-1.5 cursor-pointer";
  const chevronCls = "w-3.5 h-3.5 text-neutral-400";
  const dropdownCls =
    "absolute top-full mt-1 left-0 z-20 bg-card border border-neutral-200 " +
    "rounded-lg shadow-md p-2 flex flex-col gap-1 min-w-max";
  const itemLabelCls =
    "flex items-center gap-2 text-sm text-neutral-800 cursor-pointer " +
    "px-1 py-0.5 rounded hover:bg-neutral-50";
  // #endregion

  return (
    <div className={containerCls} ref={containerRef} onBlur={handleBlur}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerBtnCls}
      >
        {summary}
        <svg className={chevronCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={dropdownCls}
          onMouseDown={(e) => e.preventDefault()}
        >
          {items.map((item) => (
            <label key={item.id} className={itemLabelCls}>
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
