"use client";

import { useState } from "react";
import type { LendingDirection } from "@/lib/supabase/database.types";

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

export default function EntryFields({
  defaultDirection = "lent",
  defaultAmount,
  defaultDate,
  defaultDueDate,
  defaultNote,
}: {
  defaultDirection?: LendingDirection;
  defaultAmount?: number;
  defaultDate?: string;
  defaultDueDate?: string | null;
  defaultNote?: string | null;
}) {
  const [direction, setDirection] = useState<LendingDirection>(defaultDirection);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-md border border-border p-1">
        <button
          type="button"
          onClick={() => setDirection("lent")}
          className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition ${
            direction === "lent" ? "bg-positive-tint text-positive" : "text-muted"
          }`}
        >
          I lent
        </button>
        <button
          type="button"
          onClick={() => setDirection("borrowed")}
          className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition ${
            direction === "borrowed" ? "bg-negative-tint text-negative" : "text-muted"
          }`}
        >
          I borrowed
        </button>
      </div>
      <input type="hidden" name="direction" value={direction} />

      <div className="flex gap-2">
        <span className="flex items-center rounded-md border border-border bg-surface px-3 text-sm text-muted">
          ₹
        </span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
          defaultValue={defaultAmount}
          className="font-amount flex-1 rounded-md border border-border bg-surface px-3 py-2 text-lg text-ink outline-none focus:border-palm"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-muted">Date</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={defaultDate ?? todayIso()}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-muted">Due date (optional)</label>
          <input
            name="due_date"
            type="date"
            defaultValue={defaultDueDate ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
          />
        </div>
      </div>

      <input
        name="note"
        placeholder="Note (optional)"
        defaultValue={defaultNote ?? ""}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-palm"
      />
    </div>
  );
}
