import sql from "mssql";
import { getPool } from "@/lib/db";
import type {
  AnswerMultipleChoiceInput,
  AnswerTextInput,
  CreateExamInput,
  ExamQuestionView,
  ExamSummary,
  IDataAccess,
  ImportQuestion,
  LookupItem,
  Lookups,
  TopicRating,
} from "@/lib/dal/types";
import { debug } from "console";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DISPLAY_KEYS = ["A", "B", "C", "D", "E"];

export const sqlDataAccess: IDataAccess = {
  async getLookups(): Promise<Lookups> {
    try {
      const pool = await getPool();
      const [levelsResult, topicsResult, questionTypesResult] = await Promise.all([
        pool.request().query<{ LevelId: number; DisplayText: string }>(
          "SELECT LevelId, DisplayText FROM [sharpener].Level ORDER BY LevelId"
        ),
        pool.request().query<{ TopicId: number; DisplayText: string }>(
          "SELECT TopicId, DisplayText FROM [sharpener].Topic ORDER BY TopicId"
        ),
        pool.request().query<{ QuestionTypeId: number; DisplayText: string }>(
          "SELECT QuestionTypeId, DisplayText FROM [sharpener].QuestionType ORDER BY QuestionTypeId"
        ),
      ]);
      return {
        levels: levelsResult.recordset.map((r): LookupItem => ({
          id: r.LevelId,
          displayText: r.DisplayText,
        })),
        topics: topicsResult.recordset.map((r): LookupItem => ({
          id: r.TopicId,
          displayText: r.DisplayText,
        })),
        questionTypes: questionTypesResult.recordset.map((r): LookupItem => ({
          id: r.QuestionTypeId,
          displayText: r.DisplayText,
        })),
      };
    } catch (err) {
      console.error("[DAL] getLookups failed", { err });
      throw err;
    }
  },

  async createTopic(displayText: string): Promise<number> {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("DisplayText", sql.NVarChar(100), displayText)
        .query<{ TopicId: number }>(`
          INSERT INTO [sharpener].Topic (DisplayText) VALUES (@DisplayText);
          SELECT SCOPE_IDENTITY() AS TopicId;
        `);
      return result.recordset[0].TopicId;
    } catch (err) {
      console.error("[DAL] createTopic failed", { err });
      throw err;
    }
  },

  async createExam(userId: string, input: CreateExamInput): Promise<number> {
    try {
      const pool = await getPool();

      // Create the Exam record
      const examResult = await pool
        .request()
        .input("userId", sql.NVarChar(50), userId)
        .input("title", sql.NVarChar(200), input.title)
        .input("dateTaken", sql.DateTime2, new Date())
        .query<{ ExamId: number }>(`
          INSERT INTO [sharpener].Exam (UserId, Title, DateTaken) VALUES (@userId, @title, @dateTaken);
          SELECT SCOPE_IDENTITY() AS ExamId;
        `);
      const examId = examResult.recordset[0].ExamId;
      
      // Insert junction rows
      for (const levelId of input.levelIds) {
        await pool.request()
          .input("examId", sql.Int, examId)
          .input("levelId", sql.Int, levelId)
          .query("INSERT INTO [sharpener].Exam_Level (ExamId, LevelId) VALUES (@examId, @levelId)");
      }
      for (const topicId of input.topicIds) {
        await pool.request()
          .input("examId", sql.Int, examId)
          .input("topicId", sql.Int, topicId)
          .query("INSERT INTO [sharpener].Exam_Topic (ExamId, TopicId) VALUES (@examId, @topicId)");
      }
      for (const questionTypeId of input.questionTypeIds) {
        await pool.request()
          .input("examId", sql.Int, examId)
          .input("questionTypeId", sql.Int, questionTypeId)
          .query("INSERT INTO [sharpener].Exam_QuestionType (ExamId, QuestionTypeId) VALUES (@examId, @questionTypeId)");
      }

      // Build IN list parameters for the question query
      const levelParams = input.levelIds.map((_, i) => `@l${i}`).join(",");
      const topicParams = input.topicIds.map((_, i) => `@t${i}`).join(",");
      const qtParams = input.questionTypeIds.map((_, i) => `@qt${i}`).join(",");

      const qReq = pool.request();
      input.levelIds.forEach((id, i) => qReq.input(`l${i}`, sql.Int, id));
      input.topicIds.forEach((id, i) => qReq.input(`t${i}`, sql.Int, id));
      input.questionTypeIds.forEach((id, i) => qReq.input(`qt${i}`, sql.Int, id));
      qReq.input("questionCount", sql.Int, input.questionCount);

      const questionsResult = await qReq.query<{ QuestionId: number; QuestionTypeId: number }>(`
        SELECT TOP(@questionCount) Q.QuestionId, Q.QuestionTypeId
        FROM [sharpener].Question Q
        WHERE Q.LevelId IN (${levelParams})
          AND Q.TopicId IN (${topicParams})
          AND Q.QuestionTypeId IN (${qtParams})
        ORDER BY NEWID()
      `);

      const questions = questionsResult.recordset;
      if (questions.length === 0) {
        // Roll back the exam if no questions matched
        await pool.request()
          .input("examId", sql.Int, examId)
          .query(`
            DELETE FROM [sharpener].Exam_Level WHERE ExamId = @examId;
            DELETE FROM [sharpener].Exam_Topic WHERE ExamId = @examId;
            DELETE FROM [sharpener].Exam_QuestionType WHERE ExamId = @examId;
            DELETE FROM [sharpener].Exam WHERE ExamId = @examId;
          `);
        throw new Error("NO_QUESTIONS_MATCHED");
      }

      // Insert Result rows and shuffle answer options for multiple-choice questions
      // QuestionTypeId = 1 assumed to be "Multiple Choice" — we check by looking up answer options
      for (let i = 0; i < questions.length; i++) {
        const { QuestionId, QuestionTypeId } = questions[i];
        const sortOrder = i + 1;

        const resultInsert = await pool.request()
          .input("examId", sql.Int, examId)
          .input("questionId", sql.Int, QuestionId)
          .input("sortOrder", sql.Int, sortOrder)
          .query<{ ResultId: number }>(`
            INSERT INTO [sharpener].Result (ExamId, QuestionId, SortOrder)
            VALUES (@examId, @questionId, @sortOrder);
            SELECT SCOPE_IDENTITY() AS ResultId;
          `);
        const resultId = resultInsert.recordset[0].ResultId;

        // Fetch answer options to detect multiple-choice
        const optionsResult = await pool.request()
          .input("questionId", sql.Int, QuestionId)
          .query<{ AnswerOptionId: number }>(`
            SELECT AnswerOptionId FROM [sharpener].AnswerOption WHERE QuestionId = @questionId
          `);

        if (optionsResult.recordset.length > 0) {
          const shuffled = shuffle(optionsResult.recordset);
          for (let k = 0; k < shuffled.length && k < DISPLAY_KEYS.length; k++) {
            await pool.request()
              .input("resultId", sql.Int, resultId)
              .input("answerOptionId", sql.Int, shuffled[k].AnswerOptionId)
              .input("displayKey", sql.Char(1), DISPLAY_KEYS[k])
              .input("sortOrder", sql.Int, k + 1)
              .query(`
                INSERT INTO [sharpener].Result_AnswerOption (ResultId, AnswerOptionId, DisplayKey, SortOrder)
                VALUES (@resultId, @answerOptionId, @displayKey, @sortOrder)
              `);
          }
        }

        void QuestionTypeId; // may be used later for type-specific logic
      }

      return examId;
    } catch (err) {
      console.error("[DAL] createExam failed", { input, err });
      throw err;
    }
  },

  async getExamQuestions(userId: string, examId: number): Promise<ExamQuestionView[]> {
    try {
      const pool = await getPool();

      const resultsResult = await pool.request()
        .input("examId", sql.Int, examId)
        .input("userId", sql.NVarChar(50), userId)
        .query<{
          ResultId: number;
          SortOrder: number;
          QuestionId: number;
          Level: string;
          Text: string;
          Explanation: string;
          AnswerOptionId: number | null;
          TextResponse: string | null;
          GradedResponse: boolean | null;
        }>(`
          SELECT
            R.ResultId, R.SortOrder, R.QuestionId,
            L.DisplayText AS Level,
            Q.Text, Q.Explanation,
            R.AnswerOptionId, R.TextResponse, R.GradedResponse
          FROM [sharpener].Result R
          JOIN [sharpener].Exam E ON E.ExamId = R.ExamId
          JOIN [sharpener].Question Q ON Q.QuestionId = R.QuestionId
          JOIN [sharpener].Level L ON L.LevelId = Q.LevelId
          WHERE R.ExamId = @examId AND E.UserId = @userId
          ORDER BY R.SortOrder
        `);

      const optionsResult = await pool.request()
        .input("examId", sql.Int, examId)
        .input("userId", sql.NVarChar(50), userId)
        .query<{
          ResultId: number;
          AnswerOptionId: number;
          DisplayKey: string;
          SortOrder: number;
          Text: string;
          IsCorrectAnswer: boolean;
        }>(`
          SELECT
            RAO.ResultId, RAO.AnswerOptionId, RAO.DisplayKey, RAO.SortOrder,
            AO.Text, AO.IsCorrectAnswer
          FROM [sharpener].Result_AnswerOption RAO
          JOIN [sharpener].Result R ON R.ResultId = RAO.ResultId
          JOIN [sharpener].Exam E ON E.ExamId = R.ExamId
          JOIN [sharpener].AnswerOption AO ON AO.AnswerOptionId = RAO.AnswerOptionId
          WHERE R.ExamId = @examId AND E.UserId = @userId
          ORDER BY RAO.ResultId, RAO.SortOrder
        `);

      const optionsByResult = new Map<number, { answerOptionId: number; displayKey: string; text: string; isCorrect: boolean }[]>();
      for (const row of optionsResult.recordset) {
        if (!optionsByResult.has(row.ResultId)) optionsByResult.set(row.ResultId, []);
        optionsByResult.get(row.ResultId)!.push({
          answerOptionId: row.AnswerOptionId,
          displayKey: row.DisplayKey,
          text: row.Text,
          isCorrect: row.IsCorrectAnswer,
        });
      }

      return resultsResult.recordset.map((row): ExamQuestionView => {
        const displayOptions = optionsByResult.get(row.ResultId) ?? [];
        return {
          resultId: row.ResultId,
          sortOrder: row.SortOrder,
          questionId: row.QuestionId,
          level: row.Level,
          text: row.Text,
          explanation: row.Explanation,
          isMultipleChoice: displayOptions.length > 0,
          displayOptions,
          answerOptionId: row.AnswerOptionId,
          textResponse: row.TextResponse,
          gradedResponse: row.GradedResponse,
        };
      });
    } catch (err) {
      console.error("[DAL] getExamQuestions failed", { examId, err });
      throw err;
    }
  },

  async answerQuestion(
    userId: string,
    resultId: number,
    answer: AnswerMultipleChoiceInput | AnswerTextInput
  ): Promise<{ isCorrect: boolean }> {
    try {
      const pool = await getPool();

      // Result has no UserId of its own — ownership is enforced by joining
      // back to Exam, same as getExamQuestions.
      if ("answerOptionId" in answer) {
        const updateResult = await pool.request()
          .input("resultId", sql.Int, resultId)
          .input("userId", sql.NVarChar(50), userId)
          .input("answerOptionId", sql.Int, answer.answerOptionId)
          .query(`
            UPDATE R
            SET R.AnswerOptionId = @answerOptionId
            FROM [sharpener].Result R
            JOIN [sharpener].Exam E ON E.ExamId = R.ExamId
            WHERE R.ResultId = @resultId AND E.UserId = @userId
          `);
        if (updateResult.rowsAffected[0] === 0) throw new Error(`Result ${resultId} not found`);
        return { isCorrect: false };
      } else {
        const updateResult = await pool.request()
          .input("resultId", sql.Int, resultId)
          .input("userId", sql.NVarChar(50), userId)
          .input("textResponse", sql.NVarChar(sql.MAX), answer.textResponse)
          .input("gradedResponse", sql.Bit, answer.gradedResponse)
          .query(`
            UPDATE R
            SET R.TextResponse = @textResponse, R.GradedResponse = @gradedResponse
            FROM [sharpener].Result R
            JOIN [sharpener].Exam E ON E.ExamId = R.ExamId
            WHERE R.ResultId = @resultId AND E.UserId = @userId
          `);
        if (updateResult.rowsAffected[0] === 0) throw new Error(`Result ${resultId} not found`);
        return { isCorrect: answer.gradedResponse };
      }
    } catch (err) {
      console.error("[DAL] answerQuestion failed", { resultId, answer, err });
      throw err;
    }
  },

  async getExams(userId: string, filters: { days?: number; topicId?: number }): Promise<ExamSummary[]> {
    try {
      const pool = await getPool();

      const req = pool.request().input("userId", sql.NVarChar(50), userId);
      let dateFilter = "";
      if (filters.days != null) {
        req.input("days", sql.Int, filters.days);
        dateFilter = "AND E.DateTaken >= DATEADD(day, -@days, GETDATE())";
      }

      let topicFilter = "";
      if (filters.topicId != null) {
        req.input("topicId", sql.Int, filters.topicId);
        topicFilter = "AND EXISTS (SELECT 1 FROM [sharpener].Exam_Topic ET WHERE ET.ExamId = E.ExamId AND ET.TopicId = @topicId)";
      }

      const summaryResult = await req.query<{
        ExamId: number;
        Title: string;
        DateTaken: Date;
        TotalCount: number;
        CorrectCount: number;
      }>(`
        SELECT
          E.ExamId, E.Title, E.DateTaken,
          COUNT(R.ResultId) AS TotalCount,
          SUM(CASE
            WHEN R.AnswerOptionId IS NOT NULL AND AO.IsCorrectAnswer = 1 THEN 1
            WHEN R.GradedResponse = 1 THEN 1
            ELSE 0
          END) AS CorrectCount
        FROM [sharpener].Exam E
        JOIN [sharpener].Result R ON R.ExamId = E.ExamId
        LEFT JOIN [sharpener].AnswerOption AO ON AO.AnswerOptionId = R.AnswerOptionId
        WHERE E.UserId = @userId
          ${dateFilter}
          ${topicFilter}
        GROUP BY E.ExamId, E.Title, E.DateTaken
        ORDER BY E.DateTaken DESC
      `);

      const examIds = summaryResult.recordset.map((r) => r.ExamId);
      if (examIds.length === 0) return [];

      const idList = examIds.join(",");
      const topicsResult = await pool.request().query<{ ExamId: number; DisplayText: string }>(`
        SELECT ET.ExamId, T.DisplayText
        FROM [sharpener].Exam_Topic ET
        JOIN [sharpener].Topic T ON T.TopicId = ET.TopicId
        WHERE ET.ExamId IN (${idList})
      `);

      const topicsByExam = new Map<number, string[]>();
      for (const row of topicsResult.recordset) {
        if (!topicsByExam.has(row.ExamId)) topicsByExam.set(row.ExamId, []);
        topicsByExam.get(row.ExamId)!.push(row.DisplayText);
      }

      const levelsResult = await pool.request().query<{
        ExamId: number;
        Level: string;
        TotalCount: number;
        CorrectCount: number;
      }>(`
        SELECT R.ExamId, L.DisplayText AS Level,
          COUNT(R.ResultId) AS TotalCount,
          SUM(CASE
            WHEN R.AnswerOptionId IS NOT NULL AND AO.IsCorrectAnswer = 1 THEN 1
            WHEN R.GradedResponse = 1 THEN 1
            ELSE 0
          END) AS CorrectCount
        FROM [sharpener].Result R
        JOIN [sharpener].Question Q ON Q.QuestionId = R.QuestionId
        JOIN [sharpener].Level L ON L.LevelId = Q.LevelId
        LEFT JOIN [sharpener].AnswerOption AO ON AO.AnswerOptionId = R.AnswerOptionId
        WHERE R.ExamId IN (${idList})
        GROUP BY R.ExamId, L.DisplayText
      `);

      const levelsByExam = new Map<number, { level: string; correct: number; total: number }[]>();
      for (const row of levelsResult.recordset) {
        if (!levelsByExam.has(row.ExamId)) levelsByExam.set(row.ExamId, []);
        levelsByExam.get(row.ExamId)!.push({
          level: row.Level,
          correct: row.CorrectCount ?? 0,
          total: row.TotalCount,
        });
      }

      return summaryResult.recordset.map((row): ExamSummary => {
        const total = row.TotalCount;
        const correct = row.CorrectCount ?? 0;
        return {
          examId: row.ExamId,
          title: row.Title,
          dateTaken: row.DateTaken.toISOString(),
          topics: topicsByExam.get(row.ExamId) ?? [],
          correctCount: correct,
          totalCount: total,
          percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
          levelBreakdown: levelsByExam.get(row.ExamId) ?? [],
        };
      });
    } catch (err) {
      console.error("[DAL] getExams failed", { filters, err });
      throw err;
    }
  },

  async getSkillRatings(userId: string): Promise<TopicRating[]> {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input("userId", sql.NVarChar(50), userId)
        .query<{
        TopicId: number;
        DisplayText: string;
        AverageScore: number;
        ExamCount: number;
      }>(`
        SELECT
          T.TopicId,
          T.DisplayText,
          COUNT(DISTINCT E.ExamId) AS ExamCount,
          AVG(CAST(
            CASE
              WHEN R.AnswerOptionId IS NOT NULL AND AO.IsCorrectAnswer = 1 THEN 1.0
              WHEN R.GradedResponse = 1 THEN 1.0
              ELSE 0.0
            END
          AS FLOAT)) * 100 AS AverageScore
        FROM [sharpener].Topic T
        JOIN [sharpener].Exam_Topic ET ON ET.TopicId = T.TopicId
        JOIN [sharpener].Exam E ON E.ExamId = ET.ExamId
        JOIN [sharpener].Result R ON R.ExamId = E.ExamId
        JOIN [sharpener].Question Q ON Q.QuestionId = R.QuestionId AND Q.TopicId = T.TopicId
        LEFT JOIN [sharpener].AnswerOption AO ON AO.AnswerOptionId = R.AnswerOptionId
        WHERE E.UserId = @userId
        GROUP BY T.TopicId, T.DisplayText
        ORDER BY T.DisplayText
      `);

      return result.recordset.map((row): TopicRating => ({
        topicId: row.TopicId,
        displayText: row.DisplayText,
        averageScore: Math.round(row.AverageScore),
        examCount: row.ExamCount,
      }));
    } catch (err) {
      console.error("[DAL] getSkillRatings failed", { err });
      throw err;
    }
  },

  async importQuestions(questions: ImportQuestion[]): Promise<void> {
    try {
      const pool = await getPool();

      for (const q of questions) {
        const topicResult = await pool.request()
          .input("displayText", sql.NVarChar(100), q.topic)
          .query<{ TopicId: number }>(
            "SELECT TopicId FROM [sharpener].Topic WHERE DisplayText = @displayText"
          );
        if (topicResult.recordset.length === 0)
          throw new Error(`Unknown topic: "${q.topic}"`);
        const topicId = topicResult.recordset[0].TopicId;

        const levelResult = await pool.request()
          .input("displayText", sql.NVarChar(100), q.level)
          .query<{ LevelId: number }>(
            "SELECT LevelId FROM [sharpener].Level WHERE DisplayText = @displayText"
          );
        if (levelResult.recordset.length === 0)
          throw new Error(`Unknown level: "${q.level}"`);
        const levelId = levelResult.recordset[0].LevelId;

        const qtResult = await pool.request()
          .input("displayText", sql.NVarChar(100), q.questionType)
          .query<{ QuestionTypeId: number }>(
            "SELECT QuestionTypeId FROM [sharpener].QuestionType WHERE DisplayText = @displayText"
          );
        if (qtResult.recordset.length === 0)
          throw new Error(`Unknown question type: "${q.questionType}"`);
        const questionTypeId = qtResult.recordset[0].QuestionTypeId;

        // Insert question
        const questionResult = await pool.request()
          .input("topicId", sql.Int, topicId)
          .input("levelId", sql.Int, levelId)
          .input("questionTypeId", sql.Int, questionTypeId)
          .input("text", sql.NVarChar(sql.MAX), q.text)
          .input("explanation", sql.NVarChar(sql.MAX), q.explanation)
          .query<{ QuestionId: number }>(`
            INSERT INTO [sharpener].Question (TopicId, LevelId, QuestionTypeId, Text, Explanation)
            VALUES (@topicId, @levelId, @questionTypeId, @text, @explanation);
            SELECT SCOPE_IDENTITY() AS QuestionId;
          `);
        const questionId = questionResult.recordset[0].QuestionId;

        // Insert answer options
        for (const opt of q.answerOptions) {
          await pool.request()
            .input("questionId", sql.Int, questionId)
            .input("text", sql.NVarChar(sql.MAX), opt.text)
            .input("isCorrectAnswer", sql.Bit, opt.isCorrectAnswer)
            .query(`
              INSERT INTO [sharpener].AnswerOption (QuestionId, Text, IsCorrectAnswer)
              VALUES (@questionId, @text, @isCorrectAnswer)
            `);
        }
      }
    } catch (err) {
      console.error("[DAL] importQuestions failed", { err });
      throw err;
    }
  },
};
