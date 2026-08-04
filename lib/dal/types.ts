export type LookupItem = { id: number; displayText: string };

export type Lookups = {
  levels: LookupItem[];
  topics: LookupItem[];
  questionTypes: LookupItem[];
};

export type CreateExamInput = {
  title: string;
  questionCount: number;
  levelIds: number[];
  topicIds: number[];
  questionTypeIds: number[];
};

export type ExamQuestionView = {
  resultId: number;
  sortOrder: number;
  questionId: number;
  level: string;
  text: string;
  explanation: string;
  isMultipleChoice: boolean;
  displayOptions: { answerOptionId: number; displayKey: string; text: string; isCorrect: boolean }[];
  answerOptionId: number | null;
  textResponse: string | null;
  gradedResponse: boolean | null;
};

export type AnswerMultipleChoiceInput = { answerOptionId: number };
export type AnswerTextInput = { textResponse: string; gradedResponse: boolean };

export type LevelBreakdown = {
  level: string;
  correct: number;
  total: number;
};

export type ExamSummary = {
  examId: number;
  title: string;
  dateTaken: string;
  topics: string[];
  correctCount: number;
  totalCount: number;
  percentage: number;
  levelBreakdown: LevelBreakdown[];
};

export type TopicRating = {
  topicId: number;
  displayText: string;
  averageScore: number;
  examCount: number;
};

export type ImportQuestion = {
  topic: string;
  level: string;
  questionType: string;
  text: string;
  explanation: string;
  answerOptions: { text: string; isCorrectAnswer: boolean }[];
};

export interface IDataAccess {
  getLookups(): Promise<Lookups>;
  createTopic(displayText: string): Promise<number>;
  createExam(userId: string, input: CreateExamInput): Promise<number>;
  getExamQuestions(userId: string, examId: number): Promise<ExamQuestionView[]>;
  answerQuestion(
    userId: string,
    resultId: number,
    answer: AnswerMultipleChoiceInput | AnswerTextInput
  ): Promise<{ isCorrect: boolean }>;
  getExams(userId: string, filters: { days?: number; topicId?: number }): Promise<ExamSummary[]>;
  getSkillRatings(userId: string): Promise<TopicRating[]>;
  importQuestions(questions: ImportQuestion[]): Promise<void>;
}
