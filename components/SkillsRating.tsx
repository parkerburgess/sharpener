"use client";

import { useEffect, useState } from "react";
import type { TopicRating } from "@/lib/dal/types";

export default function SkillsRating() {
  const [ratings, setRatings] = useState<TopicRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => { setRatings(data); setLoading(false); });
  }, []);

  return (
    <div className="bg-gray-50 rounded-xl shadow p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-800">Skills Rating</h2>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : ratings.length === 0 ? (
        <p className="text-gray-400 text-sm">No exam data yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {ratings.map((r) => (
            <TopicCard key={r.topicId} rating={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicCard({ rating }: { rating: TopicRating }) {
  const pctColor =
    rating.averageScore >= 80 ? "text-green-600" :
    rating.averageScore >= 60 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
      <span className={`text-2xl font-bold w-14 text-center ${pctColor}`}>
        {rating.averageScore}%
      </span>
      <div>
        <p className="font-semibold text-gray-800">{rating.displayText}</p>
        <p className="text-xs text-gray-500">{rating.examCount} exam{rating.examCount !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}
