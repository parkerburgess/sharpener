"use client";

import { useEffect, useState } from "react";
import type { Lookups, TopicQuestionCounts } from "@/lib/dal/types";
import QuestionImportCard from "@/components/QuestionImportCard";
import GenerateQuestionsCard from "@/components/GenerateQuestionsCard";
import QuestionCountsTable from "@/components/QuestionCountsTable";

type PageData = {
  lookups: Lookups;
  topicCounts: TopicQuestionCounts[];
};

async function fetchPageData(): Promise<PageData> {
  const [lookupsRes, countsRes] = await Promise.all([
    fetch("/api/lookups"),
    fetch("/api/question-counts"),
  ]);
  if (!lookupsRes.ok || !countsRes.ok) {
    throw new Error("Failed to load question data");
  }
  const lookups = (await lookupsRes.json()) as Lookups;
  const topicCounts = (await countsRes.json()) as TopicQuestionCounts[];
  return { lookups, topicCounts };
}

export default function QuestionManagement() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  /* Bumped after any change (import, generate) to reload lookups
     and counts, so every card and the table see the same fresh data. */
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchPageData();
        if (cancelled) return;
        setPageData(data);
        setLoadError(null);
      } catch {
        if (cancelled) return;
        setLoadError("Failed to load question data. Refresh to try again.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refreshData() {
    setRefreshKey((key) => key + 1);
  }

  // #region Tailwind utility consts
  const wrapperCls = "max-w-7xl w-full mx-auto grid gap-6";
  const pageTitleCls = "text-xl font-bold text-neutral-800";
  const statusTextCls = "text-sm text-neutral-500";
  const errorTextCls = "text-sm text-danger-600";
  const cardsGridCls = "grid gap-6";
  // #endregion

  return (
    <div className={wrapperCls}>
      <h1 className={pageTitleCls}>Question Management</h1>

      {loadError && <p className={errorTextCls}>{loadError}</p>}

      {!pageData ? (
        !loadError && <p className={statusTextCls}>Loading...</p>
      ) : (
        <>
          <div className={cardsGridCls}>
            <QuestionImportCard onImported={refreshData} />
            <GenerateQuestionsCard
              lookups={pageData.lookups}
              onGenerated={refreshData}
            />
          </div>

          <QuestionCountsTable
            levels={pageData.lookups.levels}
            questionTypes={pageData.lookups.questionTypes}
            topicCounts={pageData.topicCounts}
          />
        </>
      )}
    </div>
  );
}
