import ExamSetUp from "@/components/ExamSetUp";
import HomeDashboard from "@/components/HomeDashboard";

export default function HomePage() {
  // #region Tailwind utility consts
  // Grows to fill whatever height the flex-column body (set in layout.tsx)
  // leaves below the shared Header, rather than assuming a fixed header
  // height the way the old `calc(100vh-6rem)` did.
  const mainCls = "flex-1 min-h-0 bg-surface p-6 flex flex-col";
  const contentWrapperCls =
    "max-w-7xl w-full mx-auto flex flex-col gap-6 flex-1 min-h-0";
  // #endregion

  return (
    <main className={mainCls}>
      <div className={contentWrapperCls}>
        <ExamSetUp />
        <HomeDashboard />
      </div>
    </main>
  );
}
