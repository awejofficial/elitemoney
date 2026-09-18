"use client";

import { useRef, useState, useTransition } from "react";
import { createRecurringRule } from "@/app/(app)/recurring/actions";
import RuleFields from "./RuleFields";
import { PlusIcon } from "@/components/icons";
import type { Account, Category } from "@/lib/supabase/database.types";

export default function NewRuleForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createRecurringRule(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setFormKey((k) => k + 1);
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <h2 className="text-sm font-medium text-muted">Add recurring rule</h2>

      <RuleFields key={formKey} accounts={accounts} categories={categories} />

      {error && <p className="text-sm text-negative">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex w-fit items-center gap-1.5 rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
      >
        <PlusIcon size={16} />
        {pending ? "Adding…" : "Add rule"}
      </button>
    </form>
  );
}
