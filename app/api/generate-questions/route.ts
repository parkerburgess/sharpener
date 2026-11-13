import { NextResponse } from "next/server";
import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaMessage,
  BetaTextBlock,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { getAnthropicClient } from "@/lib/anthropic-client";
import { dal } from "@/lib/dal";
import type { ImportQuestion, LookupItem, Lookups } from "@/lib/dal";
import { badRequest, serverError, unprocessable } from "@/lib/api-response";

const GENERATION_MODEL = "claude-sonnet-5-5";

// If Sonnet 5.5's safety filter declines a request, the API re-runs it on
// this model inside the same call instead of returning a refusal.
const FALLBACK_MODEL = "claude-sonnet-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Room for 20 questions plus the model's thinking. Streaming (below) keeps a
// budget this size from hitting the SDK's HTTP timeout.
const MAX_OUTPUT_TOKENS = 32000;

type GenerateQuestionsRequest = {
  prompt: string;
};

type GeneratedQuestions = {
  questions: ImportQuestion[];
};

function displayTexts(items: LookupItem[]): string[] {
  return items.map((item) => item.displayText);
}

/*
 * The JSON shape Claude must return. Structured output makes the API enforce
 * it, so the reply always parses, and topic/level/questionType can only be
 * values that exist in the lookup tables. That means importQuestions can't
 * fail on an "Unknown topic"-style mismatch.
 */
function buildQuestionsSchema(lookups: Lookups): Record<string, unknown> {
  const answerOptionSchema = {
    type: "object",
    properties: {
      text: { type: "string" },
      isCorrectAnswer: { type: "boolean" },
    },
    required: ["text", "isCorrectAnswer"],
    additionalProperties: false,
  };

  const questionSchema = {
    type: "object",
    properties: {
      topic: { type: "string", enum: displayTexts(lookups.topics) },
      level: { type: "string", enum: displayTexts(lookups.levels) },
      questionType: {
        type: "string",
        enum: displayTexts(lookups.questionTypes),
      },
      text: { type: "string" },
      explanation: { type: "string" },
      answerOptions: { type: "array", items: answerOptionSchema },
    },
    required: [
      "topic",
      "level",
      "questionType",
      "text",
      "explanation",
      "answerOptions",
    ],
    additionalProperties: false,
  };

  return {
    type: "object",
    properties: {
      questions: { type: "array", items: questionSchema },
    },
    required: ["questions"],
    additionalProperties: false,
  };
}

function isTextBlock(block: BetaContentBlock): block is BetaTextBlock {
  return block.type === "text";
}

/*
 * When a fallback happens, the response holds a "fallback" block marking where
 * the declining model stopped. Only the text after the last one belongs to the
 * model that finished the answer.
 */
function finalAnswerText(message: BetaMessage): string {
  const lastFallbackIndex = message.content.findLastIndex(
    (block) => block.type === "fallback"
  );
  return message.content
    .slice(lastFallbackIndex + 1)
    .filter(isTextBlock)
    .map((block) => block.text)
    .join("");
}

/*
 * The SDK already retries rate limits, overloads and 5xx twice before
 * throwing, so anything that reaches here has failed for real.
 */
function anthropicErrorResponse(err: APIError): NextResponse {
  if (err instanceof Anthropic.AuthenticationError) {
    return serverError(
      "The AI service rejected the API key. Check ANTHROPIC_API_KEY."
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return serverError("The AI service is rate limiting requests. Try again in a minute.");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return serverError("Could not reach the AI service. Check your connection and try again.");
  }
  if (err instanceof Anthropic.BadRequestError) {
    return serverError(`The AI service rejected the request: ${err.message}`);
  }
  return serverError("The AI service had a problem. Try again in a minute.");
}

async function readRequestBody(
  request: Request
): Promise<GenerateQuestionsRequest | null> {
  try {
    return (await request.json()) as GenerateQuestionsRequest;
  } catch {
    return null;
  }
}

async function generateQuestions(
  prompt: string,
  lookups: Lookups
): Promise<BetaMessage> {
  const client = getAnthropicClient();
  const stream = client.beta.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    betas: [FALLBACK_BETA],
    fallbacks: [{ model: FALLBACK_MODEL }],
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: buildQuestionsSchema(lookups) },
    },
    messages: [{ role: "user", content: prompt }],
  });
  return await stream.finalMessage();
}

export async function POST(request: Request) {
  const body = await readRequestBody(request);
  if (!body?.prompt?.trim()) {
    return badRequest("prompt is required");
  }

  let lookups: Lookups;
  try {
    lookups = await dal.getLookups();
  } catch {
    return serverError("Could not load topics and levels from the database.");
  }

  let message: BetaMessage;
  try {
    message = await generateQuestions(body.prompt, lookups);
  } catch (err) {
    console.error("[generate-questions] Anthropic call failed", { err });
    if (err instanceof Anthropic.APIError) {
      return anthropicErrorResponse(err);
    }
    return serverError("Question generation failed unexpectedly. Try again.");
  }

  if (message.stop_reason === "refusal") {
    return unprocessable("The AI declined this request. Try a different topic or wording.");
  }
  if (message.stop_reason === "max_tokens") {
    return unprocessable("Response was cut off. Try requesting fewer questions.");
  }

  // The schema guarantees the shape, so a parse failure here would be an
  // API-side fault rather than something the model got wrong.
  let generated: GeneratedQuestions;
  try {
    generated = JSON.parse(finalAnswerText(message)) as GeneratedQuestions;
  } catch {
    return unprocessable("The AI returned unreadable output. Try again.");
  }

  if (generated.questions.length === 0) {
    return unprocessable("The AI returned no questions. Try again.");
  }

  try {
    await dal.importQuestions(generated.questions);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    return serverError(`Questions were generated but could not be saved: ${reason}`);
  }

  return NextResponse.json({ imported: generated.questions.length });
}
