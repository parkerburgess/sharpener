"use client";

import { useState } from "react";
import ExamResults from "@/components/ExamResults";
import SkillsRating from "@/components/SkillsRating";
import type { ExamFilterSelection } from "@/lib/exam-filters";

const NO_FILTERS: ExamFilterSelection = { days: "", topicId: "" };

/*
 * Owns the Exam Results filters so Skills Rating can rate the same exams.
 * Renders a fragment so both panels stay direct children of the home page's
 * flex column.
 */
export default function HomeDashboard() {
  const [filters, setFilters] = useState<ExamFilterSelection>(NO_FILTERS);

  // #region Tailwind utility consts
  // No overflow here: ExamResults scrolls its own card list so the title,
  // filters and card background stay put.
  const resultsWrapperCls = "flex-1 min-h-0";
  const skillsWrapperCls = "shrink-0 overflow-x-auto";
  // #endregion

  return (
    <>
      <div className={resultsWrapperCls}>
        <ExamResults filters={filters} onFiltersChange={setFilters} />
      </div>
      <div className={skillsWrapperCls}>
        <SkillsRating filters={filters} />
      </div>
    </>
  );
}
