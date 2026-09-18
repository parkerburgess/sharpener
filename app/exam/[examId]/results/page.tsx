"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ExamResultCard from "@/components/ExamResultCard";
import type { ExamSummary } from "@/lib/dal/types";

export default function ExamResultsPage() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((data: ExamSummary[]) => {
        const found = data.find((e) => e.examId === Number(examId)) ?? null;
        setExam(found);
        setLoading(false);
      });
  }, [examId]);

  // #region Tailwind utility consts
  const pageCls =
    "min-h-screen bg-surface p-6 flex items-center justify-center";
  const cardCls =
    "max-w-lg w-full bg-card rounded-xl shadow p-6 flex flex-col gap-6";
  const titleCls = "text-3xl font-bold text-neutral-800";
  const loadingTextCls = "text-neutral-400";
  const notFoundTextCls = "text-neutral-500";
  const homeLinkCls =
    "text-center bg-primary-700 hover:bg-primary-800 text-primary-foreground " +
    "font-semibold rounded-lg px-4 py-2 transition";
  // #endregion

  return (
    <main className={pageCls}>
      <div className={cardCls}>
        <h1 className={titleCls}>Exam Complete</h1>

        {loading ? (
          <p className={loadingTextCls}>Loading results...</p>
        ) : !exam ? (
          <p className={notFoundTextCls}>Results not found.</p>
        ) : (
          <ExamResultCard exam={exam} />
        )}

        <Link href="/" className={homeLinkCls}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
