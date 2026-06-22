"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QuestionDisplay from "@/components/QuestionDisplay";
import type { ExamQuestionView } from "@/lib/dal/types";

export default function ReviewPage() {
  const { examId } = useParams<{ examId: string }>();
  const [questions, setQuestions] = useState<ExamQuestionView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [missedOnly, setMissedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/exam/${examId}/questions`)
      .then((r) => r.json())
      .then((data) => { setQuestions(data); setLoading(false); });
  }, [examId]);

  const filtered = missedOnly
    ? questions.filter(
        (q) =>
          (q.answerOptionId == null && q.textResponse == null) || // skipped
          q.gradedResponse === false // text answer marked wrong
        // Note: MC correctness would require fetching AnswerOption.IsCorrectAnswer separately
      )
    : questions;

  function handleNext() {
    if (currentIndex >= filtered.length - 1) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
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
          <span>REVIEW MODE</span>
          <label className="flex items-center gap-2 font-normal cursor-pointer">
            <input
              type="checkbox"
              checked={missedOnly}
              onChange={(e) => { setMissedOnly(e.target.checked); setCurrentIndex(0); }}
            />
            Show missed only
          </label>
        </div>

        <div className="bg-white rounded-xl shadow p-8">
          <QuestionDisplay
            question={current}
            totalCount={filtered.length}
            mode="review"
            onAnswer={async () => ({ isCorrect: false })}
            onSkip={() => {}}
            onNext={handleNext}
            isLast={currentIndex === filtered.length - 1}
          />
        </div>
      </div>
    </main>
  );
}
