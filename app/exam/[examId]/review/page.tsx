"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QuestionDisplay from "@/components/QuestionDisplay";
import type { ExamQuestionView, ExamSummary } from "@/lib/dal/types";

export default function ReviewPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<ExamQuestionView[]>([]);
  const [title, setTitle] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [missedOnly, setMissedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/exam/${examId}/questions`).then((r) => r.json()),
      fetch("/api/exams").then((r) => r.json()),
    ]).then(([questions, exams]: [ExamQuestionView[], ExamSummary[]]) => {
      setQuestions(questions);
      setTitle(exams.find((e) => e.examId === Number(examId))?.title ?? "");
      setLoading(false);
    });
  }, [examId]);

  const filtered = missedOnly
    ? questions.filter((q) => {
        const isSkipped = q.answerOptionId == null && q.textResponse == null;
        const isTextWrong = q.gradedResponse === false;
        const selectedOpt = q.displayOptions.find(
          (o) => o.answerOptionId === q.answerOptionId
        );
        const isMcWrong =
          q.answerOptionId != null &&
          selectedOpt != null &&
          !selectedOpt.isCorrect;
        return isSkipped || isTextWrong || isMcWrong;
      })
    : questions;

  function handleNext() {
    if (currentIndex >= filtered.length - 1) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleBack() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function handleMissedOnlyChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMissedOnly(e.target.checked);
    setCurrentIndex(0);
    setDone(false);
  }

  // #region Tailwind utility consts
  const screenCenterCls =
    "min-h-screen bg-surface flex items-center justify-center";
  const loadingTextCls = "text-gray-400";
  const completionCardCls =
    "bg-card rounded-xl shadow p-8 flex flex-col gap-4 max-w-sm w-full text-center";
  const completionMessageCls = "text-gray-700 font-medium";
  const homeLinkCls =
    "bg-brand-600 hover:bg-brand-700 text-white font-semibold " +
    "rounded-lg px-4 py-2 transition";
  const mainCls = "min-h-screen bg-surface p-6";
  const contentWrapperCls = "max-w-2xl mx-auto flex flex-col gap-4";
  const reviewBannerCls =
    "bg-caution-100 border border-caution-300 text-caution-800 " +
    "rounded-lg px-4 py-2 text-sm font-semibold flex items-center justify-between";
  const bannerTitleColCls = "flex flex-col gap-0.5";
  const bannerTitleSubCls = "font-normal text-caution-700 text-xs";
  const bannerControlsCls = "flex items-center gap-4 font-normal";
  const missedOnlyLabelCls = "flex items-center gap-2 cursor-pointer";
  const missedOnlyTextCls = "text-caution-800";
  const endReviewBtnCls =
    "text-sm font-semibold text-caution-700 hover:text-caution-900 " +
    "transition cursor-pointer";
  const questionCardCls = "bg-card rounded-xl shadow p-8";
  // #endregion

  if (loading) {
    return (
      <main className={screenCenterCls}>
        <p className={loadingTextCls}>Loading review...</p>
      </main>
    );
  }

  if (done || filtered.length === 0) {
    return (
      <main className={screenCenterCls}>
        <div className={completionCardCls}>
          <p className={completionMessageCls}>
            {filtered.length === 0
              ? "No questions match the filter."
              : "Review complete!"}
          </p>
          <Link href="/" className={homeLinkCls}>
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const current = filtered[currentIndex];

  return (
    <main className={mainCls}>
      <div className={contentWrapperCls}>
        <div className={reviewBannerCls}>
          <div className={bannerTitleColCls}>
            <span>REVIEW MODE</span>
            {title && <span className={bannerTitleSubCls}>{title}</span>}
          </div>
          <div className={bannerControlsCls}>
            <label className={missedOnlyLabelCls}>
              <input
                type="checkbox"
                checked={missedOnly}
                onChange={handleMissedOnlyChange}
              />
              <span className={missedOnlyTextCls}>Show missed only</span>
            </label>
            <button
              onClick={() => router.push("/")}
              className={endReviewBtnCls}
            >
              End Review
            </button>
          </div>
        </div>

        <div className={questionCardCls}>
          <QuestionDisplay
            key={current.resultId}
            question={current}
            totalCount={filtered.length}
            questionNumber={currentIndex + 1}
            mode="review"
            onAnswer={async () => ({ isCorrect: false })}
            onSkip={() => {}}
            onNext={handleNext}
            onBack={currentIndex > 0 ? handleBack : undefined}
            isLast={currentIndex === filtered.length - 1}
          />
        </div>
      </div>
    </main>
  );
}
