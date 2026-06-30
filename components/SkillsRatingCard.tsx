import type { TopicRating } from "@/lib/dal/types";

export default function SkillsRatingCard({ rating }: { rating: TopicRating }) {
  const pctColor =
    rating.averageScore >= 80 ? "text-correct-600" :
    rating.averageScore >= 60 ? "text-caution-600" : "text-incorrect-500";

  // #region Tailwind utility consts
  const cardCls =
    "bg-card rounded-lg shadow-sm border border-neutral-200 p-4 flex items-center gap-4";
  const pctValueCls = `text-2xl font-bold w-14 text-center ${pctColor}`;
  const topicCls = "font-semibold text-neutral-800";
  const examCountCls = "text-xs text-neutral-500";
  // #endregion

  return (
    <div className={cardCls}>
      <span className={pctValueCls}>
        {rating.averageScore}%
      </span>
      <div>
        <p className={topicCls}>{rating.displayText}</p>
        <p className={examCountCls}>
          {rating.examCount} exam{rating.examCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
