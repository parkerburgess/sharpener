import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";

export async function GET() {
  const lookups = await dal.getLookups();
  return NextResponse.json(lookups);
}
