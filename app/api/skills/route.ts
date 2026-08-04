import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  const ratings = await dal.getSkillRatings(userId);
  return NextResponse.json(ratings);
}
