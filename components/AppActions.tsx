"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@parkerburgess/wandering-parker-ui";
import type { LookupItem } from "@/lib/dal/types";
import GenerateQuestionsModal from "@/components/GenerateQuestionsModal";

export default function AppActions() {
  const [open, setOpen] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [existingTopics, setExistingTopics] = useState<LookupItem[] | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openTopicModal() {
    setOpen(false);
    setNewTopicName("");
    setTopicError(null);
    setShowTopicModal(true);
    if (!existingTopics) {
      const res = await fetch("/api/lookups");
      const data = (await res.json()) as { topics: LookupItem[] };
      setExistingTopics(data.topics);
    }
  }

  function closeTopicModal() {
    setShowTopicModal(false);
    setNewTopicName("");
    setTopicError(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOpen(false);
    setImporting(true);
    try {
      const text = await file.text();
      const body = JSON.parse(text) as unknown;
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { imported?: number; error?: string };
      if (res.ok) {
        alert(`Imported ${data.imported} question(s)`);
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  function handleMenuToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(!open);
  }

  function handleImportClick(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    importRef.current?.click();
  }

  function handleGenerateClick(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    setShowGenerateModal(true);
  }

  function handleCreateTopicClick(e: React.MouseEvent) {
    e.stopPropagation();
    openTopicModal();
  }

  function handleTopicFormSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    void handleCreateTopic();
  }

  function handleTopicNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewTopicName(e.target.value);
    setTopicError(null);
  }

  async function handleCreateTopic() {
    if (!newTopicName.trim()) return;
    setSavingTopic(true);
    setTopicError(null);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayText: newTopicName.trim() }),
      });
      const data = (await res.json()) as { topicId?: number; error?: string };
      if (res.ok) {
        setExistingTopics(null); // force refresh next open
        closeTopicModal();
      } else {
        setTopicError(data.error ?? "Failed to create topic");
      }
    } finally {
      setSavingTopic(false);
    }
  }

  // #region Tailwind utility consts
  const menuWrapperCls = "relative";
  const menuTriggerBtnCls =
    "border border-neutral-300 rounded-lg p-2 text-neutral-600 " +
    "hover:bg-neutral-50 transition cursor-pointer";
  const menuDropdownCls =
    "absolute left-0 top-full mt-1 bg-card border border-neutral-200 " +
    "rounded-lg shadow-md z-20 min-w-48";
  const menuItemImportCls =
    "block w-full text-left px-4 py-2.5 text-sm text-neutral-600 " +
    "hover:bg-neutral-50 rounded-t-lg cursor-pointer";
  const menuItemGenerateCls =
    "block w-full text-left px-4 py-2.5 text-sm text-neutral-600 " +
    "hover:bg-neutral-50 cursor-pointer border-t border-neutral-100";
  const menuItemCreateTopicCls =
    "block w-full text-left px-4 py-2.5 text-sm text-neutral-600 " +
    "hover:bg-neutral-50 rounded-b-lg cursor-pointer border-t border-neutral-100";
  const importInputCls = "hidden";
  const topicModalTitleCls = "text-base font-semibold text-neutral-800 mb-4";
  const topicFormCls = "grid gap-4";
  const topicFieldCls = "grid gap-1.5";
  const topicLabelCls = "text-sm font-medium text-neutral-700";
  const topicInputCls =
    "text-sm border border-neutral-300 rounded-lg px-3 py-2 " +
    "text-neutral-800 bg-surface placeholder-gray-400";
  const topicErrorCls = "text-xs text-incorrect-500";
  const loadingTopicsTextCls = "text-xs text-neutral-400";
  const existingTopicsGroupCls = "grid gap-1.5";
  const existingTopicsLabelCls =
    "text-xs font-medium text-neutral-500 uppercase tracking-wide";
  const existingTopicsListCls =
    "max-h-40 overflow-y-auto border border-neutral-200 " +
    "rounded-lg divide-y divide-neutral-100";
  const existingTopicsItemCls = "px-3 py-1.5 text-sm text-neutral-600";
  const topicActionsRowCls = "flex justify-end gap-2 pt-1";
  const cancelBtnCls =
    "text-sm border border-neutral-300 rounded-lg px-4 py-2 " +
    "text-neutral-600 hover:bg-neutral-50 transition cursor-pointer";
  const saveBtnCls =
    "text-sm bg-neutral-800 text-white rounded-lg px-4 py-2 " +
    "hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed " +
    "transition cursor-pointer";
  // #endregion

  return (
    <>
      <div ref={menuRef} className={menuWrapperCls}>
        <button
          onClick={handleMenuToggle}
          aria-label="App menu"
          className={menuTriggerBtnCls}
        >
          {importing ? (
            <svg className="animate-spin h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {open && (
          <div className={menuDropdownCls}>
            <button onClick={handleImportClick} className={menuItemImportCls}>
              Import Questions
            </button>
            <button onClick={handleGenerateClick} className={menuItemGenerateCls}>
              Generate Questions
            </button>
            <button onClick={handleCreateTopicClick} className={menuItemCreateTopicCls}>
              Create New Topic
            </button>
          </div>
        )}

        <input
          ref={importRef}
          type="file"
          accept=".json"
          className={importInputCls}
          onChange={handleImport}
        />
      </div>

      {showTopicModal && (
        <Modal onClose={closeTopicModal} size="sm">
          <h2 className={topicModalTitleCls}>Create New Topic</h2>

            <form onSubmit={handleTopicFormSubmit} className={topicFormCls}>
              <div className={topicFieldCls}>
                <label className={topicLabelCls}>Topic name</label>
                <input
                  autoFocus
                  value={newTopicName}
                  onChange={handleTopicNameChange}
                  placeholder="e.g. React Hooks"
                  className={topicInputCls}
                />
                {topicError && (
                  <p className={topicErrorCls}>{topicError}</p>
                )}
              </div>

              {existingTopics === null ? (
                <p className={loadingTopicsTextCls}>Loading existing topics...</p>
              ) : existingTopics.length > 0 ? (
                <div className={existingTopicsGroupCls}>
                  <p className={existingTopicsLabelCls}>Existing topics</p>
                  <ul className={existingTopicsListCls}>
                    {existingTopics.map((t) => (
                      <li key={t.id} className={existingTopicsItemCls}>
                        {t.displayText}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className={topicActionsRowCls}>
                <button
                  type="button"
                  onClick={closeTopicModal}
                  className={cancelBtnCls}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTopic || !newTopicName.trim()}
                  className={saveBtnCls}
                >
                  {savingTopic ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
        </Modal>
      )}

      <GenerateQuestionsModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </>
  );
}
