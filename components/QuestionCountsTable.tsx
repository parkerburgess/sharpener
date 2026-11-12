import type { LookupItem, TopicQuestionCounts } from "@/lib/dal/types";

type Props = {
  levels: LookupItem[];
  questionTypes: LookupItem[];
  topicCounts: TopicQuestionCounts[];
};

/*
 * Level and question-type columns come from the lookup tables, so a new
 * level or type shows up without a code change. Each group adds up to the
 * Total column on its own.
 */
export default function QuestionCountsTable({
  levels,
  questionTypes,
  topicCounts,
}: Props) {
  // #region Tailwind utility consts
  const cardCls =
    "bg-card rounded-xl shadow border border-neutral-200 p-6 grid gap-4";
  const cardTitleCls = "text-base font-semibold text-neutral-800";
  const emptyTextCls = "text-sm text-neutral-500";
  const tableScrollCls = "overflow-x-auto";
  const tableCls = "w-full text-sm border-collapse";
  const groupHeaderRowCls = "text-xs text-neutral-500 uppercase tracking-wide";
  const groupHeaderCellCls =
    "px-4 pb-2 text-center font-medium border-b border-neutral-200";
  const blankGroupCellCls = "px-4 pb-2";
  const columnHeaderRowCls = "text-xs text-neutral-600 border-b border-neutral-400";
  const topicHeaderCellCls = "px-4 py-2 text-left font-medium";
  const countHeaderCellCls = "px-4 py-2 text-right font-medium";
  const bodyRowCls = "border-b border-neutral-100 hover:bg-neutral-50";
  const topicCellCls = "px-4 py-2 text-left text-neutral-800";
  const countCellCls = "px-4 py-2 text-right tabular-nums text-neutral-800";
  const zeroCountCellCls = "px-4 py-2 text-right tabular-nums text-neutral-400";
  const totalCellCls =
    "px-4 py-2 text-right tabular-nums font-semibold text-neutral-900";
  // #endregion

  function renderCountCell(key: string, count: number) {
    const cellCls = count === 0 ? zeroCountCellCls : countCellCls;
    return (
      <td key={key} className={cellCls}>
        {count}
      </td>
    );
  }

  return (
    <section className={cardCls}>
      <h2 className={cardTitleCls}>Questions by Topic</h2>

      {topicCounts.length === 0 ? (
        <p className={emptyTextCls}>No topics yet.</p>
      ) : (
        <div className={tableScrollCls}>
          <table className={tableCls}>
            <thead>
              <tr className={groupHeaderRowCls}>
                <th className={blankGroupCellCls} />
                <th colSpan={levels.length} className={groupHeaderCellCls}>
                  Level
                </th>
                <th
                  colSpan={questionTypes.length}
                  className={groupHeaderCellCls}
                >
                  Type
                </th>
                <th className={blankGroupCellCls} />
              </tr>
              <tr className={columnHeaderRowCls}>
                <th className={topicHeaderCellCls}>Topic</th>
                {levels.map((level) => (
                  <th key={`level-${level.id}`} className={countHeaderCellCls}>
                    {level.displayText}
                  </th>
                ))}
                {questionTypes.map((questionType) => (
                  <th
                    key={`type-${questionType.id}`}
                    className={countHeaderCellCls}
                  >
                    {questionType.displayText}
                  </th>
                ))}
                <th className={countHeaderCellCls}>Total</th>
              </tr>
            </thead>
            <tbody>
              {topicCounts.map((topic) => (
                <tr key={topic.topicId} className={bodyRowCls}>
                  <td className={topicCellCls}>{topic.displayText}</td>
                  {levels.map((level) =>
                    renderCountCell(
                      `level-${level.id}`,
                      topic.countsByLevelId[level.id] ?? 0
                    )
                  )}
                  {questionTypes.map((questionType) =>
                    renderCountCell(
                      `type-${questionType.id}`,
                      topic.countsByQuestionTypeId[questionType.id] ?? 0
                    )
                  )}
                  <td className={totalCellCls}>{topic.totalCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
