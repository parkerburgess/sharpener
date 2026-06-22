import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";

export async function GET() {
  const ratings = await dal.getSkillRatings();
  return NextResponse.json(ratings);
}
