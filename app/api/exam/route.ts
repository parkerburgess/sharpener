import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import type { CreateExamInput } from "@/lib/dal";
import { getUserId } from "@parkerburgess/wandering-parker-server";
import { badRequest } from "@/lib/api-response";

export async function POST(request: Request) {
  const body = (await request.json()) as CreateExamInput;

  if (!body.title?.trim() || !body.levelIds?.length || !body.topicIds?.length || !body.questionTypeIds?.length) {
    return badRequest("Missing required fields");
  }
  if (!Number.isInteger(body.questionCount) || body.questionCount < 1) {
    return badRequest("Question count must be a positive integer");
  }

  try {
    const userId = await getUserId();
    const examId = await dal.createExam(userId, body);
    return NextResponse.json({ examId });
  } catch (err) {
    if (err instanceof Error && err.message === "NO_QUESTIONS_MATCHED") {
      return badRequest("No questions found matching the selected criteria");
    }
    throw err;
  }
}
