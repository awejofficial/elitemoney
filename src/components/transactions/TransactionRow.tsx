"use client";

import { useState, useTransition } from "react";
import { updateTransaction, deleteTransaction } from "@/app/(app)/transactions/actions";
import TransactionFields from "./TransactionFields";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { Account, Category } from "@/lib/supabase/database.types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export type TransactionWithJoins = {
  id: string;
  account_id: string;
  category_id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  note: string | null;
  category: { name: string; icon: string; color: string } | null;
  account: { name: string } | null;
};

export default function TransactionRow({
  transaction,
  accounts,
  categories,
}: {
  transaction: TransactionWithJoins;
  accounts: Account[];
  categories: Category[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateTransaction(transaction.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this transaction?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 bg-sand-tint p-3">
        <form action={handleUpdate} className="flex flex-col gap-3">
          <TransactionFields
            accounts={accounts}
            categories={categories}
            defaultType={transaction.type}
            defaultAccountId={transaction.account_id}
            defaultCategoryId={transaction.category_id}
            defaultAmount={transaction.amount}
            defaultDate={transaction.date}
            defaultNote={transaction.note}
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

  const category = transaction.category;

  return (
    <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-sunken">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: `${category?.color ?? "#8b8262"}26` }}
        >
          {category?.icon ?? "💰"}
        </span>
        <div>
          <p className="font-medium text-ink">{category?.name ?? "Uncategorized"}</p>
          <p className="text-xs text-muted">
            {transaction.account?.name} · {new Date(transaction.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {transaction.note ? ` · ${transaction.note}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`font-amount font-medium ${
            transaction.type === "income" ? "text-positive" : "text-negative"
          }`}
        >
          {transaction.type === "income" ? "+" : "−"}
          {currency.format(transaction.amount)}
        </span>
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
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
