import ExamSetUp from "@/components/ExamSetUp";
import ExamResults from "@/components/ExamResults";
import SkillsRating from "@/components/SkillsRating";

export default function HomePage() {
  return (
    <main className="h-[calc(100vh-6rem)] bg-surface p-6 flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex flex-col gap-6 flex-1 min-h-0">
        <ExamSetUp />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ExamResults />
        </div>
        <div className="shrink-0 overflow-x-auto">
          <SkillsRating />
        </div>
      </div>
    </main>
  );
}
