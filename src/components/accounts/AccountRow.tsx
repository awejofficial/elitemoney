"use client";

import { useState, useTransition } from "react";
import { updateAccount, deleteAccount } from "@/app/(app)/accounts/actions";
import AccountTypeSelect from "./AccountTypeSelect";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { AccountBalance } from "@/lib/supabase/database.types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function AccountRow({ account }: { account: AccountBalance }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateAccount(account.account_id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete "${account.name}"? This also deletes all its transactions. This can't be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(account.account_id);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <form
        action={handleUpdate}
        className="flex flex-col gap-2 rounded-xl border border-palm/40 bg-sand-tint p-3 sm:flex-row sm:items-center"
      >
        <input
          name="name"
          defaultValue={account.name}
          required
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
        />
        <AccountTypeSelect name="type" defaultValue={account.type} />
        <input
          name="starting_balance"
          type="number"
          step="0.01"
          defaultValue={account.starting_balance}
          className="w-36 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
        />
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
        {error && <p className="text-sm text-negative">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:bg-surface-sunken sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <div className="min-w-0">
        <p className="font-medium text-ink">{account.name}</p>
        <p className="text-xs text-muted capitalize">{account.type}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          className={`font-amount font-medium ${account.balance < 0 ? "text-negative" : "text-ink"}`}
        >
          {currency.format(account.balance)}
        </span>
        <div className="flex items-center gap-2">
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
