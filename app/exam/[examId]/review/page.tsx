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
        const selectedOpt = q.displayOptions.find((o) => o.answerOptionId === q.answerOptionId);
        const isMcWrong = q.answerOptionId != null && selectedOpt != null && !selectedOpt.isCorrect;
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">Loading review...</p>
      </main>
    );
  }

  if (done || filtered.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 flex flex-col gap-4 max-w-sm w-full text-center">
          <p className="text-gray-700 font-medium">
            {filtered.length === 0 ? "No questions match the filter." : "Review complete!"}
          </p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 transition">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const current = filtered[currentIndex];

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Banner */}
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-2 text-sm font-semibold flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span>REVIEW MODE</span>
            {title && <span className="font-normal text-yellow-700 text-xs">{title}</span>}
          </div>
          <div className="flex items-center gap-4 font-normal">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={missedOnly}
                onChange={(e) => { setMissedOnly(e.target.checked); setCurrentIndex(0); setDone(false); }}
              />
              <span className="text-yellow-800">Show missed only</span>
            </label>
            <button
              onClick={() => router.push("/")}
              aria-label="Exit review"
              className="w-6 h-6 rounded-full flex items-center justify-center text-yellow-700 hover:bg-yellow-200 transition font-bold text-base leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-8">
          <QuestionDisplay
            key={current.resultId}
            question={current}
            totalCount={filtered.length}
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
