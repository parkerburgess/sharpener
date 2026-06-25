import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic-client";
import { buildQuestionPrompt } from "@/lib/prompt-builder";
import { dal } from "@/lib/dal";
import type { ImportQuestion } from "@/lib/dal";

type GenerateQuestionsRequest = {
  topic: string;
  levels: string[];
  questionTypes: string[];
  count: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateQuestionsRequest;

  if (!body.topic || !body.levels?.length || !body.questionTypes?.length || !body.count) {
    return NextResponse.json(
      { error: "topic, levels, questionTypes, and count are required" },
      { status: 400 }
    );
  }

  const prompt = buildQuestionPrompt(body);
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(rawText) as { questions: ImportQuestion[] };

  await dal.importQuestions(parsed.questions);

  return NextResponse.json({ imported: parsed.questions.length });
}
