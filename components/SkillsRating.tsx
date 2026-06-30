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

  return (
    <div className="bg-card rounded-xl shadow p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-neutral-800">Skills Rating</h2>

      {loading ? (
        <p className="text-neutral-400 text-sm">Loading...</p>
      ) : ratings.length === 0 ? (
        <p className="text-neutral-400 text-sm">No exam data yet.</p>
      ) : (
        <div className="flex flex-row gap-3">
          {ratings.map((r) => (
            <SkillsRatingCard key={r.topicId} rating={r} />
          ))}
        </div>
      )}
    </div>
  );
}
