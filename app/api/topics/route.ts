import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";

export async function POST(request: Request) {
  const body = (await request.json()) as { displayText?: string };

  if (!body.displayText?.trim()) {
    return NextResponse.json({ error: "displayText is required" }, { status: 400 });
  }

  try {
    const topicId = await dal.createTopic(body.displayText.trim());
    return NextResponse.json({ topicId });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UQ_Topic")) {
      return NextResponse.json({ error: "A topic with that name already exists" }, { status: 400 });
    }
    throw err;
  }
}
