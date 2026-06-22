import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const topicIdParam = searchParams.get("topicId");

  const filters: { days?: number; topicId?: number } = {};
  if (daysParam) filters.days = Number(daysParam);
  if (topicIdParam) filters.topicId = Number(topicIdParam);

  const exams = await dal.getExams(filters);
  return NextResponse.json(exams);
}
