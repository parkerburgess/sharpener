"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import QuestionDisplay from "@/components/QuestionDisplay";
import type { ExamQuestionView } from "@/lib/dal/types";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<ExamQuestionView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exam/${examId}/questions`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to load questions");
        setQuestions(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error(err);
        setLoading(false);
      });
  }, [examId]);

  async function handleAnswer(
    resultId: number,
    answer: { answerOptionId: number } | { textResponse: string; gradedResponse: boolean }
  ) {
    const res = await fetch(`/api/result/${resultId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answer),
    });
    return res.json() as Promise<{ isCorrect: boolean }>;
  }

  function handleNext() {
    if (currentIndex >= questions.length - 1) {
      router.push(`/exam/${examId}/results`);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleSkip() {
    if (currentIndex >= questions.length - 1) {
      router.push(`/exam/${examId}/results`);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  // #region Tailwind utility consts
  const screenCenterCls =
    "min-h-screen bg-surface flex items-center justify-center";
  const loadingTextCls = "text-neutral-400";
  const emptyTextCls = "text-neutral-500";
  const mainCls = "min-h-screen bg-surface p-6";
  const questionCardCls = "max-w-2xl mx-auto bg-card rounded-xl shadow p-8";
  // #endregion

  if (loading) {
    return (
      <main className={screenCenterCls}>
        <p className={loadingTextCls}>Loading exam...</p>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className={screenCenterCls}>
        <p className={emptyTextCls}>No questions found for this exam.</p>
      </main>
    );
  }

  const current = questions[currentIndex];

  return (
    <main className={mainCls}>
      <div className={questionCardCls}>
        <QuestionDisplay
          key={current.resultId}
          question={current}
          totalCount={questions.length}
          mode="exam"
          onAnswer={handleAnswer}
          onSkip={handleSkip}
          onNext={handleNext}
          isLast={currentIndex === questions.length - 1}
        />
      </div>
    </main>
  );
}
