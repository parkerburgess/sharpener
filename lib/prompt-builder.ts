type PromptParams = {
  topic: string;
  levels: string[];
  questionTypes: string[];
  count: number;
};

export function buildQuestionPrompt(p: PromptParams): string {
  return `Generate questions for a self exam.

Requirements:
- Question count: ${p.count}
- topic: ${p.topic}
- Level[s]: ${p.levels.join(", ")}
- questionType[s]: ${p.questionTypes.map((q) => `'${q}'`).join(", ")}
- spread the questions out evenly across the levels
- Each question has exactly one correct answer
- Do not write questions that imply multiple selections
- Each question has between 3 and 5 answer options, vary the count across questions
- Do not repeat concepts across questions
- Include a 2-4 sentence explanation for the correct answer

Respond only with valid JSON matching this schema exactly.
No preamble, no markdown fences, no explanation outside the JSON:

{
  "questions": [
    {
      "topic": "",
      "level": "",
      "questionType": "",
      "text": "",
      "explanation": "",
      "answerOptions": [
        { "text": "", "isCorrectAnswer": true },
        { "text": "", "isCorrectAnswer": false }
      ]
    }
  ]
}`;
}
