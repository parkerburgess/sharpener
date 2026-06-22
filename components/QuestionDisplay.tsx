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
  isLast: boolean;
};

type AnsweredState = { isCorrect: boolean; explanation: string };

export default function QuestionDisplay({ question, totalCount, mode, onAnswer, onSkip, onNext, isLast }: Props) {
  const [answered, setAnswered] = useState<AnsweredState | null>(
    // In review mode, pre-populate answered state from existing data
    mode === "review" && (question.answerOptionId != null || question.textResponse != null || question.gradedResponse != null)
      ? buildReviewState(question)
      : null
  );
  const [textInput, setTextInput] = useState(mode === "review" ? (question.textResponse ?? "") : "");
  const [selfGrade, setSelfGrade] = useState<boolean | null>(null);
  const [awaitingSelfGrade, setAwaitingSelfGrade] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSkipped = mode === "review" && question.answerOptionId == null && question.textResponse == null;

  async function handleOptionSelect(answerOptionId: number) {
    if (answered || mode === "review") return;
    setSubmitting(true);
    const result = await onAnswer(question.resultId, { answerOptionId });
    setAnswered({ isCorrect: result.isCorrect, explanation: question.explanation });
    setSubmitting(false);
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
      {/* Question text */}
      <div>
        <p className="text-xs text-gray-400 mb-2">
          Question {question.sortOrder} of {totalCount}
        </p>
        <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap">{question.text}</p>
      </div>

      {/* Skipped notice (review only) */}
      {isSkipped && (
        <p className="text-gray-400 italic text-sm">This question was skipped.</p>
      )}

      {/* Multiple choice options */}
      {question.isMultipleChoice && !isSkipped && (
        <div className="flex flex-col gap-2">
          {question.displayOptions.map((opt) => {
            const isSelected = mode === "review"
              ? question.answerOptionId === opt.answerOptionId
              : answered != null; // we don't track which was selected client-side for exam mode here
            const reviewSelected = mode === "review" && question.answerOptionId === opt.answerOptionId;
            const base = "flex items-start gap-3 p-3 rounded-lg border text-sm";
            let extra = "border-gray-200 bg-white";
            if (reviewSelected) {
              extra = question.gradedResponse === false || (
                // For MC, derive correctness from answerOptionId being what it is
                // In review mode the isCorrect state isn't stored here, use card color
                false
              ) ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50";
            }
            void isSelected;
            return (
              <button
                key={opt.answerOptionId}
                disabled={!!answered || mode === "review" || submitting}
                onClick={() => handleOptionSelect(opt.answerOptionId)}
                className={`${base} ${extra} text-left disabled:cursor-default`}
              >
                <span className="font-bold text-gray-500 w-5 shrink-0">{opt.displayKey}.</span>
                <span className="text-gray-800">{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Text answer */}
      {!question.isMultipleChoice && !isSkipped && (
        <div className="flex flex-col gap-2">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={awaitingSelfGrade || !!answered || mode === "review"}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 placeholder-gray-500"
            placeholder="Type your answer here..."
          />
          {!answered && !awaitingSelfGrade && mode === "exam" && (
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || submitting}
              className="self-start bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
            >
              Submit
            </button>
          )}
          {awaitingSelfGrade && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">Did you get it right?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelfGrade(true)}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
                >
                  I got it right
                </button>
                <button
                  onClick={() => handleSelfGrade(false)}
                  disabled={submitting}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
                >
                  I got it wrong
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Correct/incorrect indicator */}
      {answered && (
        <div className={`rounded-lg p-3 text-sm font-medium ${answered.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
          {answered.isCorrect ? "Correct!" : "Incorrect"}
        </div>
      )}

      {/* Review mode: show grade for text answers */}
      {mode === "review" && !question.isMultipleChoice && question.gradedResponse != null && !isSkipped && (
        <div className={`rounded-lg p-3 text-sm font-medium ${question.gradedResponse ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
          {question.gradedResponse ? "Marked correct" : "Marked incorrect"}
        </div>
      )}

      {/* Explanation */}
      {(answered || mode === "review") && !isSkipped && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold text-blue-800 mb-1">Explanation</p>
          <p className="whitespace-pre-wrap">{question.explanation}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 justify-end">
        {mode === "exam" && !answered && !awaitingSelfGrade && (
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-4 py-2 transition"
          >
            Skip
          </button>
        )}
        {(answered || mode === "review") && (
          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-6 py-2 transition"
          >
            {isLast ? (mode === "exam" ? "See Results" : "Done") : "Next"}
          </button>
        )}
        {mode === "review" && isSkipped && (
          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-6 py-2 transition"
          >
            {isLast ? "Done" : "Next"}
          </button>
        )}
      </div>

      {selfGrade !== null && <span className="hidden">{String(selfGrade)}</span>}
    </div>
  );
}

function buildReviewState(question: ExamQuestionView): AnsweredState {
  let isCorrect = false;
  if (question.answerOptionId != null) {
    // For MC in review: we don't have IsCorrectAnswer on the client view,
    // so we can't know here — leave isCorrect false; review page doesn't show the indicator
    isCorrect = false;
  } else if (question.gradedResponse != null) {
    isCorrect = question.gradedResponse;
  }
  return { isCorrect, explanation: question.explanation };
}
