"use client";

import { useRef, useState, useTransition } from "react";
import { createLendingEntry } from "@/app/(app)/people/[personId]/actions";
import EntryFields from "./EntryFields";
import { PlusIcon } from "@/components/icons";

export default function NewEntryForm({ personId }: { personId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLendingEntry(personId, formData);
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
      <h2 className="text-sm font-medium text-muted">Add entry</h2>

      <EntryFields key={formKey} />

      {error && <p className="text-sm text-negative">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex w-fit items-center gap-1.5 rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
      >
        <PlusIcon size={16} />
        {pending ? "Adding…" : "Add entry"}
      </button>
    </form>
  );
}
