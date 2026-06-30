import ExamSetUp from "@/components/ExamSetUp";
import ExamResults from "@/components/ExamResults";
import SkillsRating from "@/components/SkillsRating";

export default function HomePage() {
  // #region Tailwind utility consts
  const mainCls = "h-[calc(100vh-6rem)] bg-surface p-6 flex flex-col";
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
