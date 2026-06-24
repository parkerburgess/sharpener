"use client";

import { useEffect, useState } from "react";
import type { ExamSummary, LookupItem } from "@/lib/dal/types";
import ExamResultCard from "@/components/ExamResultCard";

const DATE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "" },
];

export default function ExamResults() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [topics, setTopics] = useState<LookupItem[]>([]);
  const [days, setDays] = useState("");
  const [topicId, setTopicId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lookups")
      .then((r) => r.json())
      .then((data) => setTopics(data.topics));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (days) params.set("days", days);
    if (topicId) params.set("topicId", topicId);
    fetch(`/api/exams?${params}`)
      .then((r) => r.json())
      .then((data) => { setExams(data); setLoading(false); });
  }, [days, topicId]);

  return (
    <div className="bg-card rounded-xl shadow p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-neutral-800">Exam Results</h2>

      <div className="flex gap-3">
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.displayText}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-neutral-400 text-sm">Loading...</p>
      ) : exams.length === 0 ? (
        <p className="text-neutral-400 text-sm">No exams found.</p>
      ) : (
        <div className="flex flex-wrap gap-3 justify-start">
          {exams.map((exam) => <ExamResultCard key={exam.examId} exam={exam} />)}
        </div>
      )}
    </div>
  );
}
