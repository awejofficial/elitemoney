"use client";

import { useState, useTransition } from "react";
import {
  updateLendingEntry,
  deleteLendingEntry,
  addRepayment,
} from "@/app/(app)/people/[personId]/actions";
import EntryFields from "./EntryFields";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { LendingEntryOutstanding } from "@/lib/supabase/database.types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  partially_settled: "Partial",
  settled: "Settled",
};

const STATUS_CLASS: Record<string, string> = {
  open: "bg-surface-sunken text-muted",
  partially_settled: "bg-sand-tint text-warning",
  settled: "bg-positive-tint text-positive",
};

export default function EntryRow({
  personId,
  entry,
}: {
  personId: string;
  entry: LendingEntryOutstanding;
}) {
  const [editing, setEditing] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateLendingEntry(personId, entry.lending_entry_id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this entry and any repayments logged against it?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteLendingEntry(personId, entry.lending_entry_id);
      if (result.error) setError(result.error);
    });
  }

  function handleSettle(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addRepayment(personId, entry.lending_entry_id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSettling(false);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 bg-sand-tint p-3">
        <form action={handleUpdate} className="flex flex-col gap-3">
          <EntryFields
            defaultDirection={entry.direction}
            defaultAmount={entry.amount}
            defaultDate={entry.date}
            defaultDueDate={entry.due_date}
            defaultNote={entry.note}
          />
          {error && <p className="text-sm text-negative">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-palm-strong px-3 py-2 text-sm font-medium text-paper disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  const isOverdue =
    entry.status !== "settled" && entry.due_date !== null && entry.due_date < todayIso();

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-amount font-medium ${entry.direction === "lent" ? "text-positive" : "text-negative"}`}>
              {entry.direction === "lent" ? "+" : "−"}
              {currency.format(entry.outstanding_amount)}
            </span>
            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${STATUS_CLASS[entry.status]}`}>
              {STATUS_LABEL[entry.status]}
            </span>
          </div>
          <p className="text-xs text-muted">
            {entry.direction === "lent" ? "Lent" : "Borrowed"} {currency.format(entry.amount)} on{" "}
            {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {entry.due_date && (
              <span className={isOverdue ? "text-negative" : undefined}>
                {" "}
                · due {new Date(entry.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {isOverdue ? " (overdue)" : ""}
              </span>
            )}
            {entry.note ? ` · ${entry.note}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {entry.status !== "settled" && (
            <button
              onClick={() => setSettling((s) => !s)}
              className="rounded-md border border-border px-2 py-1 text-xs text-ink"
            >
              Settle
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-sunken hover:text-ink"
          >
            <PencilIcon size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="flex h-11 w-11 items-center justify-center rounded-md text-negative hover:bg-negative-tint disabled:opacity-30"
          >
            <TrashIcon size={15} />
          </button>
        </div>
      </div>

      {settling && (
        <form
          action={handleSettle}
          className="flex items-end gap-2 rounded-md border border-border bg-surface-sunken p-2.5"
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-muted">Amount paid</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={entry.outstanding_amount}
              defaultValue={entry.outstanding_amount}
              required
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-palm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-muted">Date</label>
            <input
              name="date"
              type="date"
              defaultValue={todayIso()}
              required
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-palm"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-palm-strong px-3 py-1.5 text-sm font-medium text-paper disabled:opacity-50"
          >
            Log
          </button>
        </form>
      )}

      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
