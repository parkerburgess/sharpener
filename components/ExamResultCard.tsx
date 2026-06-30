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

  // #region Tailwind utility consts
  const cardCls =
    "bg-card rounded-xl shadow border border-neutral-200 p-4 flex flex-col gap-2 w-72";
  const headerRowCls = "flex items-center justify-between gap-2";
  const titleCls = "font-semibold text-neutral-800 truncate";
  const reviewBtnCls =
    "shrink-0 text-neutral-400 hover:text-brand-600 transition cursor-pointer";
  const statsRowCls = "flex items-start gap-4";
  const pctColCls = "flex flex-col items-center w-16 shrink-0";
  const pctValueCls = `text-3xl font-bold ${pctColor}`;
  const pctSubtextCls = "text-sm text-neutral-500";
  const levelBreakdownColCls = "flex flex-col gap-0.5 flex-1";
  const levelRowCls = "grid grid-cols-[2.5rem_1fr] items-center gap-1 text-sm";
  const activeLevelScoreCls = "text-right font-medium tabular-nums text-neutral-700";
  const inactiveLevelScoreCls = "text-right font-medium tabular-nums text-neutral-300";
  const activeLevelNameCls = "text-neutral-500";
  const inactiveLevelNameCls = "text-neutral-300";
  // #endregion

  return (
    <div className={cardCls}>
      <div className={headerRowCls}>
        <p
          ref={titleRef}
          className={titleCls}
          title={titleTruncated ? exam.title : undefined}
        >
          {exam.title}
        </p>
        <button
          onClick={() => router.push(`/exam/${exam.examId}/review`)}
          title="Review"
          className={reviewBtnCls}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
      <div className={statsRowCls}>
        <div className={pctColCls}>
          <span className={pctValueCls}>{exam.percentage}%</span>
          <span className={pctSubtextCls}>
            {exam.correctCount}/{exam.totalCount}
          </span>
        </div>
        <div className={levelBreakdownColCls}>
          {LEVEL_ORDER.map((levelName) => {
            const lb = levelMap.get(levelName);
            const active = lb != null && lb.total > 0;
            return (
              <div key={levelName} className={levelRowCls}>
                <span className={active ? activeLevelScoreCls : inactiveLevelScoreCls}>
                  {active ? `${lb.correct}/${lb.total}` : "0/0"}
                </span>
                <span className={active ? activeLevelNameCls : inactiveLevelNameCls}>
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
