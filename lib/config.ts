import path from "node:path";

/*
 * Server-only file locations. Resolved from the project root (process.cwd()),
 * which is where `next dev` / `next start` run from.
 */
export const QUESTION_IMPORT_TEMPLATE_PATH = path.join(
  process.cwd(),
  "question-import-template.json"
);
