import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { getUserId } from "@parkerburgess/wandering-parker-server";

export async function GET(request: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const topicIdParam = searchParams.get("topicId");

  const filters: { days?: number; topicId?: number } = {};
  if (daysParam) filters.days = Number(daysParam);
  if (topicIdParam) filters.topicId = Number(topicIdParam);

  const exams = await dal.getExams(userId, filters);
  return NextResponse.json(exams);
}
