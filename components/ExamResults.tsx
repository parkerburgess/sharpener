"use client";

import { useEffect, useState } from "react";
import type { ExamSummary, LookupItem } from "@/lib/dal/types";
import { examFiltersQuery } from "@/lib/exam-filters";
import type { ExamFilterSelection } from "@/lib/exam-filters";
import ExamResultCard from "@/components/ExamResultCard";
import { SlowRequestNotice, useSlowRequestNotice } from "@parkerburgess/wandering-parker-ui";

const DATE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "" },
];

type Props = {
  filters: ExamFilterSelection;
  onFiltersChange: (filters: ExamFilterSelection) => void;
};

export default function ExamResults({ filters, onFiltersChange }: Props) {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [topics, setTopics] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lookups")
      .then((r) => r.json())
      .then((data) => setTopics(data.topics));
  }, []);

  useEffect(() => {
    function showExams(data: ExamSummary[]) {
      setExams(data);
      setLoading(false);
    }

    fetch(`/api/exams?${examFiltersQuery(filters)}`)
      .then((r) => r.json())
      .then(showExams);
  }, [filters]);

  function handleDaysChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onFiltersChange({ ...filters, days: e.target.value });
  }

  function handleTopicChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onFiltersChange({ ...filters, topicId: e.target.value });
  }

  const slowMessage = useSlowRequestNotice(loading);

  // #region Tailwind utility consts
  const wrapperCls =
    "bg-card rounded-xl shadow p-6 flex flex-col gap-4 h-full min-h-0";
  const filterRowCls = "flex items-center gap-3";
  const titleCls = "text-xl font-bold text-neutral-800 mr-1";
  const filterSelectCls =
    "border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-800 " +
    "bg-card hover:bg-neutral-50 focus:outline-none focus:ring-2 " +
    "focus:ring-primary-400 cursor-pointer";
  const statusTextCls = "text-neutral-400 text-sm";
  // Takes the height left under the filters and scrolls inside the card
  // background. p-1/-m-1 keeps card shadows from being clipped at the edges
  // without shifting the cards out of line with the title.
  const cardsGridCls =
    "flex-1 min-h-0 overflow-y-auto p-1 -m-1 " +
    "flex flex-wrap content-start gap-3 justify-start";
  // #endregion

  return (
    <div className={wrapperCls}>
      <div className={filterRowCls}>
        <h2 className={titleCls}>Exam Results</h2>

        <select
          value={filters.days}
          onChange={handleDaysChange}
          className={filterSelectCls}
        >
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.topicId}
          onChange={handleTopicChange}
          className={filterSelectCls}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.displayText}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <>
          <p className={statusTextCls}>Loading...</p>
          <SlowRequestNotice message={slowMessage} />
        </>
      ) : exams.length === 0 ? (
        <p className={statusTextCls}>No exams found.</p>
      ) : (
        <div className={cardsGridCls}>
          {exams.map((exam) => <ExamResultCard key={exam.examId} exam={exam} />)}
        </div>
      )}
    </div>
  );
}
