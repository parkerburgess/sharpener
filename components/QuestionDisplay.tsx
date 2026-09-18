"use client";

import { useState } from "react";
import type { ExamQuestionView } from "@/lib/dal/types";

type Props = {
  question: ExamQuestionView;
  totalCount: number;
  questionNumber?: number;
  mode: "exam" | "review";
  onAnswer: (resultId: number, answer: { answerOptionId: number } | { textResponse: string; gradedResponse: boolean }) => Promise<{ isCorrect: boolean }>;
  onSkip: () => void;
  onNext: () => void;
  onBack?: () => void;
  isLast: boolean;
};

type AnsweredState = { isCorrect: boolean; explanation: string };

export default function QuestionDisplay({
  question,
  totalCount,
  questionNumber,
  mode,
  onAnswer,
  onSkip,
  onNext,
  onBack,
  isLast,
}: Props) {
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [answered, setAnswered] = useState<AnsweredState | null>(
    mode === "review" && (question.answerOptionId != null || question.textResponse != null || question.gradedResponse != null)
      ? buildReviewState(question)
      : null
  );
  const [textInput, setTextInput] = useState(mode === "review" ? (question.textResponse ?? "") : "");
  const [selfGrade, setSelfGrade] = useState<boolean | null>(null);
  const [awaitingSelfGrade, setAwaitingSelfGrade] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSkipped = mode === "review" && question.answerOptionId == null && question.textResponse == null;
  const displayNumber = questionNumber ?? question.sortOrder;

  function handleOptionSelect(answerOptionId: number) {
    if (answered || mode === "review") return;
    const opt = question.displayOptions.find((o) => o.answerOptionId === answerOptionId);
    setSelectedOptionId(answerOptionId);
    setAnswered({ isCorrect: opt?.isCorrect ?? false, explanation: question.explanation });
    void onAnswer(question.resultId, { answerOptionId });
  }

  async function handleTextSubmit() {
    if (!textInput.trim() || awaitingSelfGrade || mode === "review") return;
    setAwaitingSelfGrade(true);
  }

  async function handleSelfGrade(gradedResponse: boolean) {
    setSelfGrade(gradedResponse);
    setSubmitting(true);
    const result = await onAnswer(question.resultId, { textResponse: textInput.trim(), gradedResponse });
    setAnswered({ isCorrect: result.isCorrect, explanation: question.explanation });
    setAwaitingSelfGrade(false);
    setSubmitting(false);
  }

  // #region Tailwind utility consts
  const wrapperCls = "flex flex-col gap-6";
  const navRowCls = "flex items-center justify-between";
  const prevBtnCls =
    "w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center " +
    "text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-default " +
    "cursor-pointer transition";
  const pageCountCls = "text-sm text-neutral-500";
  const nextReviewBtnCls =
    "w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center " +
    "text-neutral-500 hover:bg-neutral-100 cursor-pointer transition";
  const examCountCls = "text-sm text-neutral-500 mb-2";
  const questionTextCls = "text-lg font-medium text-neutral-800 whitespace-pre-wrap";
  const skippedTextCls = "text-neutral-400 italic text-sm";
  const optionsListCls = "flex flex-col gap-2";
  const optionBaseCls =
    "flex items-start gap-3 p-3 rounded-lg border text-sm " +
    "text-left cursor-pointer disabled:cursor-default";
  const optionDefaultCls = "border-neutral-200 bg-card";
  const optionCorrectExamCls = "border-success-400 bg-success-50";
  const optionIncorrectExamCls = "border-danger-400 bg-danger-50";
  const optionCorrectReviewCls = "border-success-300 bg-success-50";
  const optionIncorrectReviewCls = "border-danger-300 bg-danger-50";
  const optionSkippedCorrectCls = "border-warning-300 bg-warning-100";
  const optionKeyCls = "font-bold text-neutral-500 w-5 shrink-0";
  const optionTextCls = "text-neutral-800";
  const textAreaWrapperCls = "flex flex-col gap-2";
  const textAreaCls =
    "w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none " +
    "focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-neutral-50 " +
    "placeholder-neutral-500";
  const textSubmitBtnCls =
    "self-start bg-primary-700 hover:bg-primary-800 disabled:opacity-50 " +
    "disabled:cursor-not-allowed cursor-pointer text-primary-foreground text-sm font-semibold " +
    "rounded-lg px-4 py-2 transition";
  const selfGradeWrapperCls = "flex flex-col gap-2";
  const selfGradeQuestionCls = "text-sm font-medium text-neutral-700";
  const selfGradeBtnsRowCls = "flex gap-2";
  const correctGradeBtnCls =
    "bg-success-700 hover:bg-success-800 disabled:opacity-50 " +
    "disabled:cursor-not-allowed cursor-pointer text-success-foreground text-sm font-semibold " +
    "rounded-lg px-4 py-2 transition";
  const incorrectGradeBtnCls =
    "bg-danger-700 hover:bg-danger-800 disabled:opacity-50 " +
    "disabled:cursor-not-allowed cursor-pointer text-danger-foreground text-sm font-semibold " +
    "rounded-lg px-4 py-2 transition";
  const answerBannerBaseCls =
    "rounded-lg p-3 text-sm font-medium flex items-center justify-between";
  const correctBannerCls = "bg-success-100 text-success-800";
  const incorrectBannerCls = "bg-danger-100 text-danger-800";
  const answerLevelCls = "text-xs font-normal opacity-70";
  const explanationBoxCls =
    "bg-primary-50 border border-primary-100 rounded-lg p-4 text-sm text-neutral-700";
  const explanationTitleCls = "font-semibold text-primary-800 mb-1";
  const explanationBodyCls = "whitespace-pre-wrap";
  const examActionsRowCls = "flex gap-3 justify-end";
  const skipBtnCls =
    "text-sm text-neutral-500 hover:text-neutral-700 border border-neutral-300 " +
    "rounded-lg px-4 py-2 cursor-pointer transition";
  const nextBtnExamCls =
    "bg-primary-700 hover:bg-primary-800 text-primary-foreground text-sm font-semibold " +
    "rounded-lg px-4 py-2 cursor-pointer transition";
  // #endregion

  return (
    <div className={wrapperCls}>
      {mode === "review" && (
        <div className={navRowCls}>
          <button
            onClick={onBack}
            disabled={!onBack}
            aria-label="Previous question"
            className={prevBtnCls}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className={pageCountCls}>Question {displayNumber} of {totalCount}</p>
          <button
            onClick={onNext}
            aria-label="Next question"
            className={nextReviewBtnCls}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      <div>
        {mode === "exam" && (
          <p className={examCountCls}>
            Question {displayNumber} of {totalCount}
          </p>
        )}
        <p className={questionTextCls}>{question.text}</p>
      </div>

      {isSkipped && (
        <p className={skippedTextCls}>This question was skipped.</p>
      )}

      {question.isMultipleChoice && (
        <div className={optionsListCls}>
          {question.displayOptions.map((opt) => {
            const reviewSelected = mode === "review" && question.answerOptionId === opt.answerOptionId;
            const examSelected = mode === "exam" && selectedOptionId === opt.answerOptionId;
            let extraCls = optionDefaultCls;
            if (examSelected && answered) {
              extraCls = answered.isCorrect ? optionCorrectExamCls : optionIncorrectExamCls;
            } else if (reviewSelected) {
              extraCls = opt.isCorrect ? optionCorrectReviewCls : optionIncorrectReviewCls;
            } else if (isSkipped && opt.isCorrect) {
              extraCls = optionSkippedCorrectCls;
            }
            return (
              <button
                key={opt.answerOptionId}
                disabled={!!answered || mode === "review" || submitting}
                onClick={() => handleOptionSelect(opt.answerOptionId)}
                className={`${optionBaseCls} ${extraCls}`}
              >
                <span className={optionKeyCls}>{opt.displayKey}.</span>
                <span className={optionTextCls}>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {!question.isMultipleChoice && !isSkipped && (
        <div className={textAreaWrapperCls}>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={awaitingSelfGrade || !!answered || mode === "review"}
            rows={4}
            className={textAreaCls}
            placeholder="Type your answer here..."
          />
          {!answered && !awaitingSelfGrade && mode === "exam" && (
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || submitting}
              className={textSubmitBtnCls}
            >
              Submit
            </button>
          )}
          {awaitingSelfGrade && (
            <div className={selfGradeWrapperCls}>
              <p className={selfGradeQuestionCls}>Did you get it right?</p>
              <div className={selfGradeBtnsRowCls}>
                <button
                  onClick={() => handleSelfGrade(true)}
                  disabled={submitting}
                  className={correctGradeBtnCls}
                >
                  I got it right
                </button>
                <button
                  onClick={() => handleSelfGrade(false)}
                  disabled={submitting}
                  className={incorrectGradeBtnCls}
                >
                  I got it wrong
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {answered && (
        <div className={`${answerBannerBaseCls} ${answered.isCorrect ? correctBannerCls : incorrectBannerCls}`}>
          <span>{answered.isCorrect ? "Correct!" : "Incorrect"}</span>
          <span className={answerLevelCls}>{question.level}</span>
        </div>
      )}

      {mode === "review" && !question.isMultipleChoice && question.gradedResponse != null && !isSkipped && (
        <div className={`${answerBannerBaseCls} ${question.gradedResponse ? correctBannerCls : incorrectBannerCls}`}>
          <span>{question.gradedResponse ? "Marked correct" : "Marked incorrect"}</span>
          <span className={answerLevelCls}>{question.level}</span>
        </div>
      )}

      {(answered || mode === "review") && !isSkipped && (
        <div className={explanationBoxCls}>
          <p className={explanationTitleCls}>Explanation</p>
          <p className={explanationBodyCls}>{question.explanation}</p>
        </div>
      )}

      {mode === "exam" && (
        <div className={examActionsRowCls}>
          {!answered && !awaitingSelfGrade && (
            <button onClick={onSkip} className={skipBtnCls}>
              Skip
            </button>
          )}
          {answered && (
            <button onClick={onNext} className={nextBtnExamCls}>
              {isLast ? "See Results" : "Next"}
            </button>
          )}
        </div>
      )}

      {selfGrade !== null && <span className="hidden">{String(selfGrade)}</span>}
    </div>
  );
}

function buildReviewState(question: ExamQuestionView): AnsweredState {
  let isCorrect = false;
  if (question.answerOptionId != null) {
    const selected = question.displayOptions.find((o) => o.answerOptionId === question.answerOptionId);
    isCorrect = selected?.isCorrect ?? false;
  } else if (question.gradedResponse != null) {
    isCorrect = question.gradedResponse;
  }
  return { isCorrect, explanation: question.explanation };
}
