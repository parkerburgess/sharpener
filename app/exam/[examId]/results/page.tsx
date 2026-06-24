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
    // Fetch all exams and find this one — simple approach since we have no single-exam endpoint
    fetch("/api/exams")
      .then((r) => r.json())
      .then((data: ExamSummary[]) => {
        const found = data.find((e) => e.examId === Number(examId)) ?? null;
        setExam(found);
        setLoading(false);
      });
  }, [examId]);

  return (
    <main className="min-h-screen bg-surface p-6 flex items-center justify-center">
      <div className="max-w-lg w-full bg-card rounded-xl shadow p-6 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-neutral-800">Exam Complete</h1>

        {loading ? (
          <p className="text-neutral-400">Loading results...</p>
        ) : !exam ? (
          <p className="text-neutral-500">Results not found.</p>
        ) : (
          <ExamResultCard exam={exam} />
        )}

        <Link
          href="/"
          className="text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg px-4 py-2 transition"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
