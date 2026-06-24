"use client";

import { useState } from "react";
import type { ExamQuestionView } from "@/lib/dal/types";

type Props = {
  question: ExamQuestionView;
  totalCount: number;
  mode: "exam" | "review";
  onAnswer: (resultId: number, answer: { answerOptionId: number } | { textResponse: string; gradedResponse: boolean }) => Promise<{ isCorrect: boolean }>;
  onSkip: () => void;
  onNext: () => void;
  onBack?: () => void;
  isLast: boolean;
};

type AnsweredState = { isCorrect: boolean; explanation: string };

export default function QuestionDisplay({ question, totalCount, mode, onAnswer, onSkip, onNext, onBack, isLast }: Props) {
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

  return (
    <div className="flex flex-col gap-6">
      {mode === "review" && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={!onBack}
            aria-label="Previous question"
            className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-default transition"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-sm text-neutral-500">Question {question.sortOrder} of {totalCount}</p>
          <button
            onClick={onNext}
            aria-label="Next question"
            className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      <div>
        {mode === "exam" && (
          <p className="text-sm text-neutral-500 mb-2">
            Question {question.sortOrder} of {totalCount}
          </p>
        )}
        <p className="text-lg font-medium text-neutral-800 whitespace-pre-wrap">{question.text}</p>
      </div>

      {isSkipped && (
        <p className="text-neutral-400 italic text-sm">This question was skipped.</p>
      )}

      {question.isMultipleChoice && (
        <div className="flex flex-col gap-2">
          {question.displayOptions.map((opt) => {
            const reviewSelected = mode === "review" && question.answerOptionId === opt.answerOptionId;
            const examSelected = mode === "exam" && selectedOptionId === opt.answerOptionId;
            const base = "flex items-start gap-3 p-3 rounded-lg border text-sm";
            let extra = "border-neutral-200 bg-card";
            if (examSelected && answered) {
              extra = answered.isCorrect ? "border-correct-400 bg-correct-50" : "border-incorrect-400 bg-incorrect-50";
            } else if (reviewSelected) {
              extra = opt.isCorrect ? "border-correct-300 bg-correct-50" : "border-incorrect-300 bg-incorrect-50";
            } else if (isSkipped && opt.isCorrect) {
              extra = "border-caution-300 bg-caution-100";
            }
            return (
              <button
                key={opt.answerOptionId}
                disabled={!!answered || mode === "review" || submitting}
                onClick={() => handleOptionSelect(opt.answerOptionId)}
                className={`${base} ${extra} text-left disabled:cursor-default`}
              >
                <span className="font-bold text-neutral-500 w-5 shrink-0">{opt.displayKey}.</span>
                <span className="text-neutral-800">{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {!question.isMultipleChoice && !isSkipped && (
        <div className="flex flex-col gap-2">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={awaitingSelfGrade || !!answered || mode === "review"}
            rows={4}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-neutral-50 placeholder-neutral-500"
            placeholder="Type your answer here..."
          />
          {!answered && !awaitingSelfGrade && mode === "exam" && (
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || submitting}
              className="self-start bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
            >
              Submit
            </button>
          )}
          {awaitingSelfGrade && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-700">Did you get it right?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelfGrade(true)}
                  disabled={submitting}
                  className="bg-correct-600 hover:bg-correct-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
                >
                  I got it right
                </button>
                <button
                  onClick={() => handleSelfGrade(false)}
                  disabled={submitting}
                  className="bg-incorrect-500 hover:bg-incorrect-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
                >
                  I got it wrong
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {answered && (
        <div className={`rounded-lg p-3 text-sm font-medium ${answered.isCorrect ? "bg-correct-100 text-correct-800" : "bg-incorrect-100 text-incorrect-700"}`}>
          {answered.isCorrect ? "Correct!" : "Incorrect"}
        </div>
      )}

      {mode === "review" && !question.isMultipleChoice && question.gradedResponse != null && !isSkipped && (
        <div className={`rounded-lg p-3 text-sm font-medium ${question.gradedResponse ? "bg-correct-100 text-correct-800" : "bg-incorrect-100 text-incorrect-700"}`}>
          {question.gradedResponse ? "Marked correct" : "Marked incorrect"}
        </div>
      )}

      {(answered || mode === "review") && !isSkipped && (
        <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 text-sm text-neutral-700">
          <p className="font-semibold text-brand-800 mb-1">Explanation</p>
          <p className="whitespace-pre-wrap">{question.explanation}</p>
        </div>
      )}

      {mode === "exam" && (
        <div className="flex gap-3 justify-end">
          {!answered && !awaitingSelfGrade && (
            <button
              onClick={onSkip}
              className="text-sm text-neutral-500 hover:text-neutral-700 border border-neutral-300 rounded-lg px-4 py-2 transition"
            >
              Skip
            </button>
          )}
          {answered && (
            <button
              onClick={onNext}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
            >
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
