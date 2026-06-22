import Link from "next/link";
import type { ExamSummary } from "@/lib/dal/types";

export default function ExamResultCard({ exam }: { exam: ExamSummary }) {
  const date = new Date(exam.dateTaken).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const pctColor =
    exam.percentage >= 80 ? "text-green-600" :
    exam.percentage >= 60 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
      <span className={`text-3xl font-bold w-16 text-center ${pctColor}`}>
        {exam.percentage}%
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{exam.title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {exam.topics.map((t) => (
            <span key={t} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {exam.correctCount}/{exam.totalCount} correct &middot; {date}
        </p>
      </div>
      <Link
        href={`/exam/${exam.examId}/review`}
        className="text-sm text-blue-600 hover:underline whitespace-nowrap"
      >
        Review
      </Link>
    </div>
  );
}
