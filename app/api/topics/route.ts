import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { badRequest } from "@/lib/api-response";

export async function POST(request: Request) {
  const body = (await request.json()) as { displayText?: string };

  if (!body.displayText?.trim()) {
    return badRequest("displayText is required");
  }

  try {
    const topicId = await dal.createTopic(body.displayText.trim());
    return NextResponse.json({ topicId });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UQ_Topic")) {
      return badRequest("A topic with that name already exists");
    }
    throw err;
  }
}
