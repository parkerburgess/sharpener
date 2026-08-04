CREATE TABLE [sharpener].QuestionType (
    QuestionTypeId  INT             NOT NULL IDENTITY(1,1),
    DisplayText     NVARCHAR(100)   NOT NULL,
    CONSTRAINT PK_QuestionType PRIMARY KEY (QuestionTypeId),
    CONSTRAINT UQ_QuestionType_DisplayText UNIQUE (DisplayText)
);

CREATE TABLE [sharpener].Level (
    LevelId         INT             NOT NULL IDENTITY(1,1),
    DisplayText     NVARCHAR(100)   NOT NULL,
    CONSTRAINT PK_Level PRIMARY KEY (LevelId),
    CONSTRAINT UQ_Level_DisplayText UNIQUE (DisplayText)
);

CREATE TABLE [sharpener].Topic (
    TopicId         INT             NOT NULL IDENTITY(1,1),
    DisplayText     NVARCHAR(100)   NOT NULL,
    CONSTRAINT PK_Topic PRIMARY KEY (TopicId),
    CONSTRAINT UQ_Topic_DisplayText UNIQUE (DisplayText)
);

CREATE TABLE [sharpener].ConfidenceLevel (
    ConfidenceLevelId   INT             NOT NULL IDENTITY(1,1),
    DisplayText         NVARCHAR(100)   NOT NULL,
    CONSTRAINT PK_ConfidenceLevel PRIMARY KEY (ConfidenceLevelId),
    CONSTRAINT UQ_ConfidenceLevel_DisplayText UNIQUE (DisplayText)
);

-- UserId holds the auth-wandering-parker service's cuid()-based User.id.
-- That User table lives in a separate service/database, so there is no
-- local FK here. Result/Exam_Level/Exam_Topic/Exam_QuestionType don't need
-- their own UserId — every query reaches them via ExamId (or ResultId ->
-- Exam), so ownership is enforced by joining back to Exam.
CREATE TABLE [sharpener].Exam (
    ExamId      INT             NOT NULL IDENTITY(1,1),
    UserId      NVARCHAR(50)    NOT NULL,
    Title       NVARCHAR(200)   NOT NULL,
    DateTaken   DATETIME2       NOT NULL,
    CONSTRAINT PK_Exam PRIMARY KEY (ExamId)
);

CREATE INDEX IX_Exam_UserId ON [sharpener].Exam (UserId);

CREATE TABLE [sharpener].Question (
    QuestionId      INT             NOT NULL IDENTITY(1,1),
    TopicId         INT             NOT NULL,
    LevelId         INT             NOT NULL,
    QuestionTypeId  INT             NOT NULL,
    Text            NVARCHAR(MAX)   NOT NULL,
    Explanation     NVARCHAR(MAX)   NOT NULL,
    CONSTRAINT PK_Question PRIMARY KEY (QuestionId),
    CONSTRAINT FK_Question_Topic FOREIGN KEY (TopicId)
        REFERENCES [sharpener].Topic (TopicId),
    CONSTRAINT FK_Question_Level FOREIGN KEY (LevelId)
        REFERENCES [sharpener].Level (LevelId),
    CONSTRAINT FK_Question_QuestionType FOREIGN KEY (QuestionTypeId)
        REFERENCES [sharpener].QuestionType (QuestionTypeId)
);

CREATE TABLE [sharpener].AnswerOption (
    AnswerOptionId  INT             NOT NULL IDENTITY(1,1),
    QuestionId      INT             NOT NULL,
    Text            NVARCHAR(MAX)   NOT NULL,
    IsCorrectAnswer BIT             NOT NULL,
    CONSTRAINT PK_AnswerOption PRIMARY KEY (AnswerOptionId),
    CONSTRAINT FK_AnswerOption_Question FOREIGN KEY (QuestionId)
        REFERENCES [sharpener].Question (QuestionId)
);

CREATE TABLE [sharpener].Exam_Level (
    Exam_LevelId    INT NOT NULL IDENTITY(1,1),
    ExamId          INT NOT NULL,
    LevelId         INT NOT NULL,
    CONSTRAINT PK_Exam_Level PRIMARY KEY (Exam_LevelId),
    CONSTRAINT FK_Exam_Level_Exam FOREIGN KEY (ExamId)
        REFERENCES [sharpener].Exam (ExamId),
    CONSTRAINT FK_Exam_Level_Level FOREIGN KEY (LevelId)
        REFERENCES [sharpener].Level (LevelId),
    CONSTRAINT UQ_Exam_Level UNIQUE (ExamId, LevelId)
);

CREATE TABLE [sharpener].Exam_Topic (
    Exam_TopicId    INT NOT NULL IDENTITY(1,1),
    ExamId          INT NOT NULL,
    TopicId         INT NOT NULL,
    CONSTRAINT PK_Exam_Topic PRIMARY KEY (Exam_TopicId),
    CONSTRAINT FK_Exam_Topic_Exam FOREIGN KEY (ExamId)
        REFERENCES [sharpener].Exam (ExamId),
    CONSTRAINT FK_Exam_Topic_Topic FOREIGN KEY (TopicId)
        REFERENCES [sharpener].Topic (TopicId),
    CONSTRAINT UQ_Exam_Topic UNIQUE (ExamId, TopicId)
);

CREATE TABLE [sharpener].Exam_QuestionType (
    Exam_QuestionTypeId INT NOT NULL IDENTITY(1,1),
    ExamId              INT NOT NULL,
    QuestionTypeId      INT NOT NULL,
    CONSTRAINT PK_Exam_QuestionType PRIMARY KEY (Exam_QuestionTypeId),
    CONSTRAINT FK_Exam_QuestionType_Exam FOREIGN KEY (ExamId)
        REFERENCES [sharpener].Exam (ExamId),
    CONSTRAINT FK_Exam_QuestionType_QuestionType FOREIGN KEY (QuestionTypeId)
        REFERENCES [sharpener].QuestionType (QuestionTypeId),
    CONSTRAINT UQ_Exam_QuestionType UNIQUE (ExamId, QuestionTypeId)
);

CREATE TABLE [sharpener].Result (
    ResultId            INT             NOT NULL IDENTITY(1,1),
    ExamId              INT             NOT NULL,
    QuestionId          INT             NOT NULL,
    ConfidenceLevelId   INT             NULL,
    SortOrder           INT             NOT NULL,
    TextResponse        NVARCHAR(MAX)   NULL,
    AnswerOptionId      INT             NULL,
    GradedResponse      BIT             NULL,
    CONSTRAINT PK_Result PRIMARY KEY (ResultId),
    CONSTRAINT FK_Result_Exam FOREIGN KEY (ExamId)
        REFERENCES [sharpener].Exam (ExamId),
    CONSTRAINT FK_Result_Question FOREIGN KEY (QuestionId)
        REFERENCES [sharpener].Question (QuestionId),
    CONSTRAINT FK_Result_ConfidenceLevel FOREIGN KEY (ConfidenceLevelId)
        REFERENCES [sharpener].ConfidenceLevel (ConfidenceLevelId),
    CONSTRAINT FK_Result_AnswerOption FOREIGN KEY (AnswerOptionId)
        REFERENCES [sharpener].AnswerOption (AnswerOptionId),
    CONSTRAINT UQ_Result_ExamQuestion UNIQUE (ExamId, QuestionId),
    CONSTRAINT CHK_Result_Response CHECK (
        (TextResponse IS NULL AND AnswerOptionId IS NULL AND GradedResponse IS NULL)
        OR (TextResponse IS NOT NULL AND AnswerOptionId IS NULL AND GradedResponse IS NOT NULL)
        OR (TextResponse IS NULL AND AnswerOptionId IS NOT NULL AND GradedResponse IS NULL)
    )
);

CREATE TABLE [sharpener].Result_AnswerOption (
    Result_AnswerOptionId   INT         NOT NULL IDENTITY(1,1),
    ResultId                INT         NOT NULL,
    AnswerOptionId          INT         NOT NULL,
    DisplayKey              CHAR(1)     NOT NULL,
    SortOrder               INT         NOT NULL,
    CONSTRAINT PK_Result_AnswerOption PRIMARY KEY (Result_AnswerOptionId),
    CONSTRAINT FK_Result_AnswerOption_Result FOREIGN KEY (ResultId)
        REFERENCES [sharpener].Result (ResultId),
    CONSTRAINT FK_Result_AnswerOption_AnswerOption FOREIGN KEY (AnswerOptionId)
        REFERENCES [sharpener].AnswerOption (AnswerOptionId),
    CONSTRAINT UQ_Result_AnswerOption UNIQUE (ResultId, AnswerOptionId),
    CONSTRAINT CHK_Result_AnswerOption_DisplayKey CHECK (DisplayKey IN ('A','B','C','D','E'))
);
