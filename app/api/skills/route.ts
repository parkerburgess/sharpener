import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { parseExamFilters } from "@/lib/exam-filters";
import { getUserId } from "@parkerburgess/wandering-parker-server";

export async function GET(request: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(request.url);
  const ratings = await dal.getSkillRatings(userId, parseExamFilters(searchParams));
  return NextResponse.json(ratings);
}
