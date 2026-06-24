import type { TopicRating } from "@/lib/dal/types";

export default function SkillsRatingCard({ rating }: { rating: TopicRating }) {
  const pctColor =
    rating.averageScore >= 80 ? "text-correct-600" :
    rating.averageScore >= 60 ? "text-caution-600" : "text-incorrect-500";

  return (
    <div className="bg-card rounded-lg shadow-sm border border-neutral-200 p-4 flex items-center gap-4">
      <span className={`text-2xl font-bold w-14 text-center ${pctColor}`}>
        {rating.averageScore}%
      </span>
      <div>
        <p className="font-semibold text-neutral-800">{rating.displayText}</p>
        <p className="text-xs text-neutral-500">{rating.examCount} exam{rating.examCount !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}
