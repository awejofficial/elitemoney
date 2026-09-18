"use client";

import { useState, useTransition } from "react";
import {
  updateRecurringRule,
  deleteRecurringRule,
  toggleRecurringRuleActive,
} from "@/app/(app)/recurring/actions";
import RuleFields from "./RuleFields";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { Account, Category } from "@/lib/supabase/database.types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function ordinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export type RuleWithJoins = {
  id: string;
  account_id: string;
  category_id: string;
  type: "income" | "expense";
  amount: number;
  day_of_month: number | null;
  next_run_date: string;
  note: string | null;
  active: boolean;
  category: { name: string; icon: string; color: string } | null;
  account: { name: string } | null;
};

export default function RuleRow({
  rule,
  accounts,
  categories,
}: {
  rule: RuleWithJoins;
  accounts: Account[];
  categories: Category[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateRecurringRule(rule.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleRecurringRuleActive(rule.id, !rule.active);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this recurring rule? Already-added transactions stay.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteRecurringRule(rule.id);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 bg-sand-tint p-3">
        <form action={handleUpdate} className="flex flex-col gap-3">
          <RuleFields
            accounts={accounts}
            categories={categories}
            defaultType={rule.type}
            defaultAccountId={rule.account_id}
            defaultCategoryId={rule.category_id}
            defaultAmount={rule.amount}
            defaultDayOfMonth={rule.day_of_month ?? undefined}
            defaultNote={rule.note}
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

  const category = rule.category;

  return (
    <div
      className={`flex flex-col gap-2.5 px-4 py-3 transition-colors hover:bg-surface-sunken sm:flex-row sm:items-center sm:justify-between sm:gap-2 ${!rule.active ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: `${category?.color ?? "#8b8262"}26` }}
        >
          {category?.icon ?? "💰"}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-ink">{category?.name ?? "Uncategorized"}</p>
          <p className="text-xs text-muted">
            {rule.account?.name} · {ordinal(rule.day_of_month ?? 1)} of month
            {rule.active ? ` · next ${new Date(rule.next_run_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : " · paused"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pl-11 sm:pl-0 sm:justify-end">
        <span
          className={`font-amount font-medium ${
            rule.type === "income" ? "text-positive" : "text-negative"
          }`}
        >
          {rule.type === "income" ? "+" : "−"}
          {currency.format(rule.amount)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            disabled={pending}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted disabled:opacity-30"
          >
            {rule.active ? "Pause" : "Resume"}
          </button>
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
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
