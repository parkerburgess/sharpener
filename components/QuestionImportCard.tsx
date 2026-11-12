"use client";

import { useRef, useState } from "react";

type Props = {
  onImported: () => void;
};

type ImportStatus =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const TEMPLATE_URL = "/api/import-template";

export default function QuestionImportCard({ onImported }: Props) {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChooseFileClick() {
    setStatus(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setStatus(null);
    try {
      const result = await importQuestionFile(file);
      setStatus(result);
      if (result.kind === "success") {
        onImported();
      }
    } finally {
      setImporting(false);
    }
  }

  // #region Tailwind utility consts
  const cardCls =
    "bg-card rounded-xl shadow border border-neutral-200 p-6 grid gap-4";
  const cardTitleCls = "text-base font-semibold text-neutral-800";
  const purposeTextCls = "text-sm text-neutral-600";
  const stepsListCls =
    "list-decimal pl-5 grid gap-1 text-sm text-neutral-700";
  const actionsRowCls = "grid grid-flow-col auto-cols-max gap-2";
  const downloadLinkCls =
    "text-sm border border-neutral-300 rounded-lg px-4 py-2 " +
    "text-neutral-600 hover:bg-neutral-50 transition cursor-pointer";
  const importBtnCls =
    "text-sm font-semibold bg-primary-fill text-primary-foreground " +
    "rounded-lg px-4 py-2 hover:bg-primary-fill-hover " +
    "disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer";
  const fileInputCls = "hidden";
  const successTextCls = "text-xs text-success-600";
  const errorTextCls = "text-xs text-danger-600";
  // #endregion

  return (
    <section className={cardCls}>
      <h2 className={cardTitleCls}>Import Questions</h2>

      <p className={purposeTextCls}>
        Write questions in an outside AI chat instead of the built-in
        generator. It can cost less, and you get to review every question
        before it goes in.
      </p>

      <ol className={stepsListCls}>
        <li>Download the JSON template.</li>
        <li>
          Give it to the AI chat with the topic, levels, question types and
          how many questions you want.
        </li>
        <li>
          Topic, level and question type values must exactly match names
          that already exist (see the table below).
        </li>
        <li>Review the result, save it as a .json file, and import it.</li>
      </ol>

      <div className={actionsRowCls}>
        <a href={TEMPLATE_URL} download className={downloadLinkCls}>
          Download template
        </a>
        <button
          type="button"
          onClick={handleChooseFileClick}
          disabled={importing}
          className={importBtnCls}
        >
          {importing ? "Importing..." : "Import JSON file"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className={fileInputCls}
        onChange={handleFileChange}
      />

      {status?.kind === "success" && (
        <p className={successTextCls}>{status.message}</p>
      )}
      {status?.kind === "error" && (
        <p className={errorTextCls}>{status.message}</p>
      )}
    </section>
  );
}

async function importQuestionFile(file: File): Promise<ImportStatus> {
  let body: unknown;
  try {
    body = JSON.parse(await file.text());
  } catch {
    return { kind: "error", message: `"${file.name}" is not valid JSON.` };
  }

  try {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { imported?: number; error?: string };
    if (!res.ok) {
      return {
        kind: "error",
        message: `Import failed: ${data.error ?? "unknown error"}`,
      };
    }
    const importedCount = data.imported ?? 0;
    const noun = importedCount === 1 ? "question" : "questions";
    return { kind: "success", message: `Imported ${importedCount} ${noun}.` };
  } catch {
    return { kind: "error", message: "Import failed. Please try again." };
  }
}
