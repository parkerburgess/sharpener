import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import type { CreateExamInput } from "@/lib/dal";

export async function POST(request: Request) {
  const body = (await request.json()) as CreateExamInput;

  if (!body.title?.trim() || !body.levelIds?.length || !body.topicIds?.length || !body.questionTypeIds?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Number.isInteger(body.questionCount) || body.questionCount < 1) {
    return NextResponse.json({ error: "Question count must be a positive integer" }, { status: 400 });
  }

  try {
    const examId = await dal.createExam(body);
    return NextResponse.json({ examId });
  } catch (err) {
    if (err instanceof Error && err.message === "NO_QUESTIONS_MATCHED") {
      return NextResponse.json({ error: "No questions found matching the selected criteria" }, { status: 400 });
    }
    throw err;
  }
}
