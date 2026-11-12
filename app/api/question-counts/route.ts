import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";

export async function GET() {
  const counts = await dal.getQuestionCountsByTopic();
  return NextResponse.json(counts);
}
