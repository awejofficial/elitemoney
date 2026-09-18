"use client";

import { useState } from "react";
import type { Account, Category, CategoryType } from "@/lib/supabase/database.types";

function todayIso() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

export default function TransactionFields({
  accounts,
  categories,
  defaultType = "expense",
  defaultAccountId,
  defaultCategoryId,
  defaultAmount,
  defaultDate,
  defaultNote,
}: {
  accounts: Account[];
  categories: Category[];
  defaultType?: CategoryType;
  defaultAccountId?: string;
  defaultCategoryId?: string;
  defaultAmount?: number;
  defaultDate?: string;
  defaultNote?: string | null;
}) {
  const [type, setType] = useState<CategoryType>(defaultType);
  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-md border border-border p-1">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition ${
            type === "expense" ? "bg-negative-tint text-negative" : "text-muted"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition ${
            type === "income" ? "bg-positive-tint text-positive" : "text-muted"
          }`}
        >
          Income
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

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

      <select
        name="category_id"
        required
        defaultValue={defaultCategoryId}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
      >
        <option value="" disabled>
          Category
        </option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <select
          name="account_id"
          required
          defaultValue={defaultAccountId}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
        >
          <option value="" disabled>
            Account
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultDate ?? todayIso()}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
        />
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
