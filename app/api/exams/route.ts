import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { parseExamFilters } from "@/lib/exam-filters";
import { getUserId } from "@parkerburgess/wandering-parker-server";

export async function GET(request: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(request.url);
  const exams = await dal.getExams(userId, parseExamFilters(searchParams));
  return NextResponse.json(exams);
}
