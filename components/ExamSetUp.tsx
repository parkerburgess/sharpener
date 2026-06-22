"use client";

import { useEffect, useState } from "react";
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

  if (!lookups) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-800">New Exam</h2>

      <div className="flex flex-row flex-wrap gap-4 items-start">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. C# Fundamentals Review"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
          <input
            type="number"
            min={1}
            className="w-24 border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={questionCount}
            onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        <CheckboxGroup label="Level" items={lookups.levels} selected={selectedLevels}
          onToggle={(id) => toggleItem(id, selectedLevels, setSelectedLevels)} />

        <CheckboxGroup label="Topic" items={lookups.topics} selected={selectedTopics}
          onToggle={(id) => toggleItem(id, selectedTopics, setSelectedTopics)} />

        <CheckboxGroup label="Question Type" items={lookups.questionTypes} selected={selectedTypes}
          onToggle={(id) => toggleItem(id, selectedTypes, setSelectedTypes)} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleStart}
        disabled={loading}
        className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition"
      >
        {loading ? "Creating..." : "Start Exam"}
      </button>
    </div>
  );
}

function CheckboxGroup({
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
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-1.5 text-sm text-gray-800 cursor-pointer">
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
    </div>
  );
}
