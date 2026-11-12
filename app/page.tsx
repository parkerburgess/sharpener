import ExamSetUp from "@/components/ExamSetUp";
import ExamResults from "@/components/ExamResults";
import SkillsRating from "@/components/SkillsRating";

export default function HomePage() {
  // #region Tailwind utility consts
  // Grows to fill whatever height the flex-column body (set in layout.tsx)
  // leaves below the shared Header, rather than assuming a fixed header
  // height the way the old `calc(100vh-6rem)` did.
  const mainCls = "flex-1 min-h-0 bg-surface p-6 flex flex-col";
  const contentWrapperCls =
    "max-w-7xl w-full mx-auto flex flex-col gap-6 flex-1 min-h-0";
  const resultsWrapperCls = "flex-1 min-h-0 overflow-y-auto";
  const skillsWrapperCls = "shrink-0 overflow-x-auto";
  // #endregion

  return (
    <main className={mainCls}>
      <div className={contentWrapperCls}>
        <ExamSetUp />
        <div className={resultsWrapperCls}>
          <ExamResults />
        </div>
        <div className={skillsWrapperCls}>
          <SkillsRating />
        </div>
      </div>
    </main>
  );
}
