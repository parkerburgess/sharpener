"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamSummary } from "@/lib/dal/types";

const LEVEL_ORDER = ["Novice", "Intermediate", "Pro"] as const;

export default function ExamResultCard({ exam }: { exam: ExamSummary }) {
  const router = useRouter();
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [titleTruncated, setTitleTruncated] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (el) setTitleTruncated(el.scrollWidth > el.offsetWidth);
  }, [exam.title]);

  const pctColor =
    exam.percentage >= 80 ? "text-correct-600" :
    exam.percentage >= 60 ? "text-caution-600" : "text-incorrect-500";

  const levelMap = new Map(exam.levelBreakdown.map((lb) => [lb.level, lb]));

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
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center w-16 shrink-0">
          <span className={`text-3xl font-bold ${pctColor}`}>
            {exam.percentage}%
          </span>
          <span className="text-sm text-neutral-500">
            {exam.correctCount}/{exam.totalCount}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          {LEVEL_ORDER.map((levelName) => {
            const lb = levelMap.get(levelName);
            const active = lb != null && lb.total > 0;
            return (
              <div key={levelName} className="grid grid-cols-[2.5rem_1fr] items-center gap-1 text-sm">
                <span className={`text-right font-medium tabular-nums ${active ? "text-neutral-700" : "text-neutral-300"}`}>
                  {active ? `${lb.correct}/${lb.total}` : "0/0"}
                </span>
                <span className={active ? "text-neutral-500" : "text-neutral-300"}>
                  {levelName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
