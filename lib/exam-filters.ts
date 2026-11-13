import type { ExamFilters } from "@/lib/dal";

/*
 * Reads ?days= and ?topicId= the same way for /api/exams and /api/skills,
 * so Exam Results and Skills Rating always filter identically.
 * Missing or empty values mean "no filter".
 */
export function parseExamFilters(searchParams: URLSearchParams): ExamFilters {
  const daysParam = searchParams.get("days");
  const topicIdParam = searchParams.get("topicId");

  const filters: ExamFilters = {};
  if (daysParam) filters.days = Number(daysParam);
  if (topicIdParam) filters.topicId = Number(topicIdParam);
  return filters;
}

/*
 * The filter dropdowns' current values, as the <select> elements hold them.
 * An empty string means "All".
 */
export type ExamFilterSelection = {
  days: string;
  topicId: string;
};

export function examFiltersQuery(selection: ExamFilterSelection): string {
  const params = new URLSearchParams();
  if (selection.days) params.set("days", selection.days);
  if (selection.topicId) params.set("topicId", selection.topicId);
  return params.toString();
}
