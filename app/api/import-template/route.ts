import { readFile } from "node:fs/promises";
import { QUESTION_IMPORT_TEMPLATE_PATH } from "@/lib/config";
import { serverError } from "@/lib/api-response";

export async function GET() {
  let templateText: string;
  try {
    templateText = await readFile(QUESTION_IMPORT_TEMPLATE_PATH, "utf8");
  } catch (err) {
    console.error("[API] import-template read failed", { err });
    return serverError("Import template could not be read");
  }

  return new Response(templateText, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition":
        'attachment; filename="question-import-template.json"',
    },
  });
}
