"use client";

import { useRef, useState, useTransition } from "react";
import { createAccount } from "@/app/(app)/accounts/actions";
import AccountTypeSelect from "./AccountTypeSelect";
import { PlusIcon } from "@/components/icons";

export default function NewAccountForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAccount(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <h2 className="text-sm font-medium text-muted">Add account</h2>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          placeholder="Account name (e.g. HDFC Savings)"
          required
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-palm"
        />
        <AccountTypeSelect name="type" />
        <input
          name="starting_balance"
          type="number"
          step="0.01"
          placeholder="Starting balance"
          defaultValue="0"
          className="w-40 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
        />
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex w-fit items-center gap-1.5 rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
      >
        <PlusIcon size={16} />
        {pending ? "Adding…" : "Add account"}
      </button>
    </form>
  );
}
