-- Adds user ownership to [sharpener].Exam. Run once against the already-
-- deployed shared ParkerFreeDB server (database-schema.md documents the
-- desired end state but isn't itself re-run against an existing DB).
--
-- Ran on 2026-08-11 against 12 pre-existing rows (dated 2026-06-22 to
-- 2026-06-25, from before user ownership existed) — added nullable,
-- backfilled to 'dev-user-1' (the shared dev-auth-bypass id), then
-- tightened to NOT NULL, rather than the original assume-empty-table
-- version of this script.

ALTER TABLE [sharpener].Exam ADD UserId NVARCHAR(50) NULL;
GO
UPDATE [sharpener].Exam SET UserId = 'dev-user-1' WHERE UserId IS NULL;
GO
ALTER TABLE [sharpener].Exam ALTER COLUMN UserId NVARCHAR(50) NOT NULL;
GO
CREATE INDEX IX_Exam_UserId ON [sharpener].Exam (UserId);
GO
