"use client";

import { useRef, useState, useTransition } from "react";
import { createPerson } from "@/app/(app)/people/actions";
import { PlusIcon } from "@/components/icons";

export default function NewPersonForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPerson(formData);
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
      <h2 className="text-sm font-medium text-muted">Add person</h2>
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Name"
          required
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-palm"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
        >
          <PlusIcon size={16} />
          Add
        </button>
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
    </form>
  );
}
