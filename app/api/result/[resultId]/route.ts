import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import type { AnswerMultipleChoiceInput, AnswerTextInput } from "@/lib/dal";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const body = (await request.json()) as AnswerMultipleChoiceInput | AnswerTextInput;
  const result = await dal.answerQuestion(Number(resultId), body);
  return NextResponse.json(result);
}
