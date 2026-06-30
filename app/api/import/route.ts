import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import type { ImportQuestion } from "@/lib/dal";
import { badRequest } from "@/lib/api-response";

export async function POST(request: Request) {
  const body = (await request.json()) as { questions: ImportQuestion[] };

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return badRequest("questions array is required");
  }

  try {
    await dal.importQuestions(body.questions);
  } catch (err) {
    if (err instanceof Error) {
      return badRequest(err.message);
    }
    throw err;
  }
  return NextResponse.json({ imported: body.questions.length });
}
