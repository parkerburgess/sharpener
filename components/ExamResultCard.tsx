"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamSummary } from "@/lib/dal/types";

export default function ExamResultCard({ exam }: { exam: ExamSummary }) {
  const router = useRouter();
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [titleTruncated, setTitleTruncated] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (el) setTitleTruncated(el.scrollWidth > el.offsetWidth);
  }, [exam.title]);
  const date = new Date(exam.dateTaken).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const pctColor =
    exam.percentage >= 80 ? "text-correct-600" :
    exam.percentage >= 60 ? "text-caution-600" : "text-incorrect-500";

  return (
    <div className="bg-card rounded-xl shadow border border-neutral-200 p-4 flex flex-col gap-2 w-72">
      <div className="flex items-center justify-between gap-2">
        <p ref={titleRef} className="font-semibold text-neutral-800 truncate" title={titleTruncated ? exam.title : undefined}>{exam.title}</p>
        <button
          onClick={() => router.push(`/exam/${exam.examId}/review`)}
          title="Review"
          className="shrink-0 text-neutral-400 hover:text-brand-600 transition cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-3xl font-bold w-16 text-center ${pctColor}`}>
          {exam.percentage}%
        </span>
        <p className="text-sm text-neutral-500 flex-1">
          {exam.correctCount}/{exam.totalCount} correct &middot; {date}
        </p>
      </div>
    </div>
  );
}
