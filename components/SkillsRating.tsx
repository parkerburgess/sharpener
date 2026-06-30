"use client";

import { useEffect, useState } from "react";
import type { TopicRating } from "@/lib/dal/types";
import SkillsRatingCard from "@/components/SkillsRatingCard";

export default function SkillsRating() {
  const [ratings, setRatings] = useState<TopicRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => {
        setRatings(data);
        setLoading(false);
      });
  }, []);

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
        <p className={statusTextCls}>No exam data yet.</p>
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
