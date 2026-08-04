-- Adds user ownership to [sharpener].Exam. Run once against the already-
-- deployed shared ParkerFreeDB server (database-schema.md documents the
-- desired end state but isn't itself re-run against an existing DB).
--
-- Non-destructive: [sharpener].Exam has no rows yet, so ADD ... NOT NULL
-- works directly with no backfill/default needed. If that's no longer true
-- by the time this runs, either backfill UserId first or add the column
-- nullable and tighten it afterward.

ALTER TABLE [sharpener].Exam ADD UserId NVARCHAR(50) NOT NULL;
GO
CREATE INDEX IX_Exam_UserId ON [sharpener].Exam (UserId);
GO
