"use client";

import { useState, useTransition } from "react";
import { updateCategory, deleteCategory } from "@/app/(app)/categories/actions";
import IconColorPicker from "./IconColorPicker";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { Category } from "@/lib/supabase/database.types";

export default function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(category.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${category.name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 bg-sand-tint p-3">
        <form action={handleUpdate} className="flex flex-col gap-2">
          <input
            name="name"
            defaultValue={category.name}
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
          />
          <IconColorPicker defaultIcon={category.icon} defaultColor={category.color} />
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

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-surface-sunken md:rounded-lg md:border md:border-border md:bg-surface">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: `${category.color}26` }}
        >
          {category.icon}
        </span>
        <span className="truncate font-medium text-ink">{category.name}</span>
        {category.is_system && (
          <span className="shrink-0 rounded-md bg-surface-sunken px-1.5 py-0.5 text-[11px] text-muted">
            Default
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <button
          onClick={() => setEditing(true)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-sunken hover:text-ink md:w-9"
        >
          <PencilIcon size={15} />
        </button>
        <button
          onClick={handleDelete}
          disabled={pending || category.is_system}
          title={category.is_system ? "Default categories can't be deleted, only edited" : undefined}
          className="flex h-11 w-11 items-center justify-center rounded-md text-negative hover:bg-negative-tint disabled:opacity-30 md:w-9"
        >
          <TrashIcon size={15} />
        </button>
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
