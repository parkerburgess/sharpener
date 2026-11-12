/*
 * Seeds mock exam history for the guest user: 3 completed exams for each of
 * C#, NextJS and Tailwind, each covering every level, 15 questions each.
 *
 * Run with:  npm run seed:mock-exams
 * Preview:   npm run seed:mock-exams -- --dry-run   (rolls back at the end)
 * (node --env-file=.env.local, so DB settings come from the environment.)
 *
 * Safe to re-run. Before seeding it deletes every exam owned by the guest
 * and by the retired "dev-user-1" dev identity, so the guest always ends
 * up with exactly the seeded set. Everything runs in one transaction; a
 * failure part-way leaves the database untouched.
 */
import sql from "mssql";

// #region Settings
// Guest is dbo.User 32. The auth service issues numeric IDs, and the JWT
// sub (what getUserId() returns) is that ID as a string.
const GUEST_USER_ID = "32";
const RETIRED_DEV_USER_ID = "dev-user-1";

const TOPIC_NAMES = ["C#", "NextJS", "Tailwind"];
const EXAMS_PER_TOPIC = 3;
const QUESTIONS_PER_EXAM = 15;

// Exams land on random days within this many days before today.
const DATE_WINDOW_DAYS = 30;

// Each topic's first exam targets a score in this range; later exams in
// the same topic improve by SCORE_STEP so skill ratings look plausible.
const FIRST_SCORE_MIN = 0.55;
const FIRST_SCORE_MAX = 0.75;
const SCORE_STEP = 0.08;
const SCORE_CAP = 0.95;

// Share of the wrongly-answered questions left blank (skipped) instead.
const SKIP_SHARE_OF_MISSES = 0.25;

const DISPLAY_KEYS = ["A", "B", "C", "D", "E"];

// --dry-run does all the work, prints it, then rolls back instead of committing.
const IS_DRY_RUN = process.argv.includes("--dry-run");

// Must match the title abbreviations in components/ExamSetUp.tsx.
const LEVEL_ABBREVIATIONS: Record<string, string> = {
  Novice: "nvc",
  Intermediate: "int",
  Pro: "pro",
};
// #endregion

type LookupRow = { id: number; displayText: string };
type PickedQuestion = { questionId: number };
type OptionRow = { answerOptionId: number; isCorrectAnswer: boolean };
type QuestionPlan = "correct" | "wrong" | "skip";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(minInclusive: number, maxInclusive: number): number {
  return Math.floor(randomBetween(minInclusive, maxInclusive + 1));
}

function abbreviateLevel(levelName: string): string {
  return LEVEL_ABBREVIATIONS[levelName] ?? levelName.slice(0, 3).toLowerCase();
}

/* Distinct past dates for one topic's exams, oldest first. */
function pickExamDates(count: number): Date[] {
  const dayOffsets = new Set<number>();
  while (dayOffsets.size < count) {
    dayOffsets.add(randomInt(1, DATE_WINDOW_DAYS));
  }
  const sortedOffsets = [...dayOffsets].sort((a, b) => b - a);
  return sortedOffsets.map(buildPastDate);
}

function buildPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(8, 21), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

/* Decides which questions are answered right, wrong, or skipped. */
function planAnswers(questionCount: number, targetScore: number): QuestionPlan[] {
  const correctCount = Math.round(questionCount * targetScore);
  const missCount = questionCount - correctCount;
  const skipCount = Math.round(missCount * SKIP_SHARE_OF_MISSES);

  const plans: QuestionPlan[] = [
    ...Array<QuestionPlan>(correctCount).fill("correct"),
    ...Array<QuestionPlan>(missCount - skipCount).fill("wrong"),
    ...Array<QuestionPlan>(skipCount).fill("skip"),
  ];
  return shuffle(plans);
}

function chooseAnswer(options: OptionRow[], plan: QuestionPlan): number | null {
  if (plan === "skip" || options.length === 0) return null;
  const wantCorrect = plan === "correct";
  const candidates = options.filter((o) => o.isCorrectAnswer === wantCorrect);
  // A question with no wrong options can only be answered correctly.
  const pool = candidates.length > 0 ? candidates : options;
  return pool[randomInt(0, pool.length - 1)].answerOptionId;
}

async function loadLookup(
  transaction: sql.Transaction,
  table: "Level" | "Topic" | "QuestionType",
): Promise<LookupRow[]> {
  const result = await new sql.Request(transaction).query<LookupRow>(`
    SELECT ${table}Id AS id, DisplayText AS displayText
    FROM [sharpener].[${table}]
    ORDER BY ${table}Id
  `);
  return result.recordset;
}

async function deleteExamsForUsers(
  transaction: sql.Transaction,
  userIds: string[],
): Promise<number> {
  const request = new sql.Request(transaction);
  userIds.forEach((id, i) => request.input(`u${i}`, sql.NVarChar(50), id));
  const userParams = userIds.map((_, i) => `@u${i}`).join(",");

  const result = await request.query<{ DeletedExams: number }>(`
    DECLARE @examIds TABLE (ExamId INT PRIMARY KEY);
    INSERT INTO @examIds
      SELECT ExamId FROM [sharpener].Exam WHERE UserId IN (${userParams});

    DELETE RAO FROM [sharpener].Result_AnswerOption RAO
      JOIN [sharpener].Result R ON R.ResultId = RAO.ResultId
      WHERE R.ExamId IN (SELECT ExamId FROM @examIds);
    DELETE FROM [sharpener].Result WHERE ExamId IN (SELECT ExamId FROM @examIds);
    DELETE FROM [sharpener].Exam_Level WHERE ExamId IN (SELECT ExamId FROM @examIds);
    DELETE FROM [sharpener].Exam_Topic WHERE ExamId IN (SELECT ExamId FROM @examIds);
    DELETE FROM [sharpener].Exam_QuestionType WHERE ExamId IN (SELECT ExamId FROM @examIds);
    DELETE FROM [sharpener].Exam WHERE ExamId IN (SELECT ExamId FROM @examIds);

    SELECT COUNT(*) AS DeletedExams FROM @examIds;
  `);
  return result.recordset[0].DeletedExams;
}

async function insertExam(
  transaction: sql.Transaction,
  title: string,
  dateTaken: Date,
  topicId: number,
  levelIds: number[],
  questionTypeIds: number[],
): Promise<number> {
  const examResult = await new sql.Request(transaction)
    .input("userId", sql.NVarChar(50), GUEST_USER_ID)
    .input("title", sql.NVarChar(200), title)
    .input("dateTaken", sql.DateTime2, dateTaken)
    .query<{ ExamId: number }>(`
      INSERT INTO [sharpener].Exam (UserId, Title, DateTaken)
      VALUES (@userId, @title, @dateTaken);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS ExamId;
    `);
  const examId = examResult.recordset[0].ExamId;

  const junctionRequest = new sql.Request(transaction)
    .input("examId", sql.Int, examId)
    .input("topicId", sql.Int, topicId);
  levelIds.forEach((id, i) => junctionRequest.input(`l${i}`, sql.Int, id));
  questionTypeIds.forEach((id, i) => junctionRequest.input(`qt${i}`, sql.Int, id));

  const levelValues = levelIds.map((_, i) => `(@examId, @l${i})`).join(",");
  const typeValues = questionTypeIds.map((_, i) => `(@examId, @qt${i})`).join(",");

  await junctionRequest.query(`
    INSERT INTO [sharpener].Exam_Topic (ExamId, TopicId) VALUES (@examId, @topicId);
    INSERT INTO [sharpener].Exam_Level (ExamId, LevelId) VALUES ${levelValues};
    INSERT INTO [sharpener].Exam_QuestionType (ExamId, QuestionTypeId) VALUES ${typeValues};
  `);
  return examId;
}

/* Same pool and randomisation the app's createExam uses. */
async function pickQuestions(
  transaction: sql.Transaction,
  topicId: number,
  levelIds: number[],
): Promise<PickedQuestion[]> {
  const request = new sql.Request(transaction)
    .input("topicId", sql.Int, topicId)
    .input("questionCount", sql.Int, QUESTIONS_PER_EXAM);
  levelIds.forEach((id, i) => request.input(`l${i}`, sql.Int, id));
  const levelParams = levelIds.map((_, i) => `@l${i}`).join(",");

  const result = await request.query<PickedQuestion>(`
    SELECT TOP(@questionCount) Q.QuestionId AS questionId
    FROM [sharpener].Question Q
    WHERE Q.TopicId = @topicId AND Q.LevelId IN (${levelParams})
    ORDER BY NEWID()
  `);
  return result.recordset;
}

async function loadOptions(
  transaction: sql.Transaction,
  questionId: number,
): Promise<OptionRow[]> {
  const result = await new sql.Request(transaction)
    .input("questionId", sql.Int, questionId)
    .query<OptionRow>(`
      SELECT AnswerOptionId AS answerOptionId, IsCorrectAnswer AS isCorrectAnswer
      FROM [sharpener].AnswerOption
      WHERE QuestionId = @questionId
    `);
  return result.recordset;
}

async function insertResult(
  transaction: sql.Transaction,
  examId: number,
  questionId: number,
  sortOrder: number,
  plan: QuestionPlan,
): Promise<boolean> {
  const options = shuffle(await loadOptions(transaction, questionId));
  const chosenOptionId = chooseAnswer(options, plan);

  const resultInsert = await new sql.Request(transaction)
    .input("examId", sql.Int, examId)
    .input("questionId", sql.Int, questionId)
    .input("sortOrder", sql.Int, sortOrder)
    .input("answerOptionId", sql.Int, chosenOptionId)
    .query<{ ResultId: number }>(`
      INSERT INTO [sharpener].Result (ExamId, QuestionId, SortOrder, AnswerOptionId)
      VALUES (@examId, @questionId, @sortOrder, @answerOptionId);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS ResultId;
    `);
  const resultId = resultInsert.recordset[0].ResultId;

  const displayedOptions = options.slice(0, DISPLAY_KEYS.length);
  if (displayedOptions.length > 0) {
    const optionRequest = new sql.Request(transaction).input("resultId", sql.Int, resultId);
    displayedOptions.forEach((o, k) => optionRequest.input(`o${k}`, sql.Int, o.answerOptionId));
    const optionValues = displayedOptions
      .map((_, k) => `(@resultId, @o${k}, '${DISPLAY_KEYS[k]}', ${k + 1})`)
      .join(",");
    await optionRequest.query(`
      INSERT INTO [sharpener].Result_AnswerOption (ResultId, AnswerOptionId, DisplayKey, SortOrder)
      VALUES ${optionValues};
    `);
  }

  const chosen = options.find((o) => o.answerOptionId === chosenOptionId);
  return chosen?.isCorrectAnswer ?? false;
}

async function seedTopic(
  transaction: sql.Transaction,
  topic: LookupRow,
  levels: LookupRow[],
  questionTypes: LookupRow[],
): Promise<void> {
  const levelIds = levels.map((l) => l.id);
  const questionTypeIds = questionTypes.map((qt) => qt.id);
  const title = `${topic.displayText} - ${levels.map((l) => abbreviateLevel(l.displayText)).join("/")}`;
  const examDates = pickExamDates(EXAMS_PER_TOPIC);
  const firstScore = randomBetween(FIRST_SCORE_MIN, FIRST_SCORE_MAX);

  for (let examIndex = 0; examIndex < EXAMS_PER_TOPIC; examIndex++) {
    const questions = await pickQuestions(transaction, topic.id, levelIds);
    if (questions.length === 0) {
      throw new Error(`No questions found for topic ${topic.displayText}`);
    }

    const examId = await insertExam(
      transaction,
      title,
      examDates[examIndex],
      topic.id,
      levelIds,
      questionTypeIds,
    );

    const targetScore = Math.min(SCORE_CAP, firstScore + SCORE_STEP * examIndex);
    const plans = planAnswers(questions.length, targetScore);
    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const isCorrect = await insertResult(
        transaction,
        examId,
        questions[i].questionId,
        i + 1,
        plans[i],
      );
      if (isCorrect) correctCount++;
    }

    const day = examDates[examIndex].toISOString().slice(0, 10);
    console.log(
      `  Exam ${examId}: "${title}" on ${day}, ${correctCount}/${questions.length} correct`,
    );
  }
}

async function main(): Promise<void> {
  const pool = await new sql.ConnectionPool({
    server: requireEnv("DB_SERVER"),
    database: requireEnv("DB_DATABASE"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    options: { encrypt: true, trustServerCertificate: false },
  }).connect();

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const levels = await loadLookup(transaction, "Level");
    const topics = await loadLookup(transaction, "Topic");
    const questionTypes = await loadLookup(transaction, "QuestionType");

    const missing = TOPIC_NAMES.filter((name) => !topics.some((t) => t.displayText === name));
    if (missing.length > 0) {
      throw new Error(`Topics not found: ${missing.join(", ")}`);
    }

    const deleted = await deleteExamsForUsers(transaction, [GUEST_USER_ID, RETIRED_DEV_USER_ID]);
    console.log(`Deleted ${deleted} existing exam(s) for guest and ${RETIRED_DEV_USER_ID}.`);

    for (const topicName of TOPIC_NAMES) {
      const topic = topics.find((t) => t.displayText === topicName)!;
      console.log(`${topicName}:`);
      await seedTopic(transaction, topic, levels, questionTypes);
    }

    if (IS_DRY_RUN) {
      await transaction.rollback();
      console.log("Dry run: all changes rolled back.");
    } else {
      await transaction.commit();
      console.log("Done.");
    }
  } catch (err) {
    await transaction.rollback();
    console.error("Seeding failed; all changes rolled back.");
    throw err;
  } finally {
    await pool.close();
  }
}

main().catch(function reportFailure(err: unknown) {
  console.error(err);
  process.exitCode = 1;
});
