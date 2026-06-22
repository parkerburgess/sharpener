import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import type { ImportQuestion } from "@/lib/dal";

export async function POST(request: Request) {
  const body = (await request.json()) as { questions: ImportQuestion[] };

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json({ error: "questions array is required" }, { status: 400 });
  }

  try {
    await dal.importQuestions(body.questions);
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
  return NextResponse.json({ imported: body.questions.length });
}
