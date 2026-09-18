"use client";

import { useRef, useState, useTransition } from "react";
import { createCategory } from "@/app/(app)/categories/actions";
import IconColorPicker from "./IconColorPicker";
import { PlusIcon } from "@/components/icons";
import type { CategoryType } from "@/lib/supabase/database.types";

export default function NewCategoryForm({ type }: { type: CategoryType }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCategory(formData);
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
      <input type="hidden" name="type" value={type} />
      <h3 className="text-sm font-medium text-muted">
        Add {type === "income" ? "income" : "expense"} category
      </h3>

      <input
        name="name"
        placeholder="Category name"
        required
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-palm"
      />

      <IconColorPicker />

      {error && <p className="text-sm text-negative">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex w-fit items-center gap-1.5 rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
      >
        <PlusIcon size={16} />
        {pending ? "Adding…" : "Add category"}
      </button>
    </form>
  );
}
