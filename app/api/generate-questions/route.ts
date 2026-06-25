import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic-client";
import { dal } from "@/lib/dal";
import type { ImportQuestion } from "@/lib/dal";

type GenerateQuestionsRequest = {
  prompt: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateQuestionsRequest;

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [{ role: "user", content: body.prompt }],
  });

  if (message.stop_reason === "max_tokens") {
    return NextResponse.json(
      { error: "Response was cut off — try requesting fewer questions" },
      { status: 422 }
    );
  }

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: { questions: ImportQuestion[] };
  try {
    parsed = JSON.parse(rawText) as { questions: ImportQuestion[] };
  } catch {
    return NextResponse.json(
      { error: "Claude returned invalid JSON — try again or reduce the question count" },
      { status: 422 }
    );
  }

  await dal.importQuestions(parsed.questions);

  return NextResponse.json({ imported: parsed.questions.length });
}
