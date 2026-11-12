import type { Metadata } from "next";
import QuestionManagement from "@/components/QuestionManagement";

export const metadata: Metadata = {
  title: "Question Management · Sharpener",
};

export default function QuestionManagementPage() {
  // #region Tailwind utility consts
  // The body is a fixed-height flex column (see layout.tsx), so this page
  // scrolls inside main rather than growing the whole document.
  const mainCls = "flex-1 min-h-0 overflow-y-auto bg-surface p-6";
  // #endregion

  return (
    <main className={mainCls}>
      <QuestionManagement />
    </main>
  );
}
