import Link from "next/link";
import type { ExamSummary } from "@/lib/dal/types";

export default function ExamResultCard({ exam }: { exam: ExamSummary }) {
  const date = new Date(exam.dateTaken).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const pctColor =
    exam.percentage >= 80 ? "text-correct-600" :
    exam.percentage >= 60 ? "text-caution-600" : "text-incorrect-500";

  return (
    <div className="bg-card rounded-xl shadow p-4 flex items-center gap-4">
      <span className={`text-3xl font-bold w-16 text-center ${pctColor}`}>
        {exam.percentage}%
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-neutral-800 truncate">{exam.title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {exam.topics.map((t) => (
            <span key={t} className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
        <p className="text-sm text-neutral-500 mt-1">
          {exam.correctCount}/{exam.totalCount} correct &middot; {date}
        </p>
      </div>
      <Link
        href={`/exam/${exam.examId}/review`}
        className="text-sm text-brand-600 hover:underline whitespace-nowrap"
      >
        Review
      </Link>
    </div>
  );
}
