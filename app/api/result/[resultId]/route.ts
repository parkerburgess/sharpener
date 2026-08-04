import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import type { AnswerMultipleChoiceInput, AnswerTextInput } from "@/lib/dal";
import { getUserId } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const userId = await getUserId();
  const { resultId } = await params;
  const body = (await request.json()) as AnswerMultipleChoiceInput | AnswerTextInput;
  const result = await dal.answerQuestion(userId, Number(resultId), body);
  return NextResponse.json(result);
}
