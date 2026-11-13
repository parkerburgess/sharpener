"use client";

import { useEffect, useState } from "react";
import type { TopicRating } from "@/lib/dal/types";
import SkillsRatingCard from "@/components/SkillsRatingCard";
import { examFiltersQuery } from "@/lib/exam-filters";
import type { ExamFilterSelection } from "@/lib/exam-filters";

type Props = {
  // The Exam Results filters, so the ratings cover the same exams.
  filters: ExamFilterSelection;
};

export default function SkillsRating({ filters }: Props) {
  const [ratings, setRatings] = useState<TopicRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function showRatings(data: TopicRating[]) {
      setRatings(data);
      setLoading(false);
    }

    fetch(`/api/skills?${examFiltersQuery(filters)}`)
      .then((r) => r.json())
      .then(showRatings);
  }, [filters]);

  const isFiltered = filters.days !== "" || filters.topicId !== "";
  const emptyMessage = isFiltered
    ? "No exams match the Exam Results filters."
    : "No exam data yet.";

  // #region Tailwind utility consts
  const wrapperCls = "bg-card rounded-xl shadow p-6 flex flex-col gap-4";
  const titleCls = "text-xl font-bold text-neutral-800";
  const statusTextCls = "text-neutral-400 text-sm";
  const cardsRowCls = "flex flex-row gap-3";
  // #endregion

  return (
    <div className={wrapperCls}>
      <h2 className={titleCls}>Skills Rating</h2>

      {loading ? (
        <p className={statusTextCls}>Loading...</p>
      ) : ratings.length === 0 ? (
        <p className={statusTextCls}>{emptyMessage}</p>
      ) : (
        <div className={cardsRowCls}>
          {ratings.map((r) => (
            <SkillsRatingCard key={r.topicId} rating={r} />
          ))}
        </div>
      )}
    </div>
  );
}
