import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { serverError } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;
    const questions = await dal.getExamQuestions(Number(examId));
    return NextResponse.json(questions);
  } catch (err) {
    console.error("[API] GET exam questions failed", err);
    return serverError("Failed to load questions");
  }
}
