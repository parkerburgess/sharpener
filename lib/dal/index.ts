import { sqlDataAccess } from "@/lib/dal/sql";
import type { IDataAccess } from "@/lib/dal/types";

export const dal: IDataAccess = sqlDataAccess;
export type {
  LookupItem,
  Lookups,
  CreateExamInput,
  ExamQuestionView,
  AnswerMultipleChoiceInput,
  AnswerTextInput,
  ExamSummary,
  TopicRating,
  ImportQuestion,
  IDataAccess,
} from "@/lib/dal/types";
