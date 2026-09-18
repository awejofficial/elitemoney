"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deletePerson } from "@/app/(app)/people/actions";
import { ChevronRightIcon, TrashIcon } from "@/components/icons";
import type { PersonBalance } from "@/lib/supabase/database.types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function PersonRow({ person }: { person: PersonBalance }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${person.name}" and all their lending entries?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePerson(person.person_id);
      if (result.error) setError(result.error);
    });
  }

  const label =
    person.net_balance > 0
      ? "owes you"
      : person.net_balance < 0
        ? "you owe"
        : "settled up";
  const color =
    person.net_balance > 0 ? "text-positive" : person.net_balance < 0 ? "text-negative" : "text-muted";

  return (
    <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-sunken">
      <Link href={`/people/${person.person_id}`} className="flex flex-1 items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-tint font-display text-sm font-medium text-palm-strong">
          {person.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-medium text-ink">{person.name}</p>
          <p className={`text-xs ${color}`}>
            {label}
            {person.net_balance !== 0 && ` · ${currency.format(Math.abs(person.net_balance))}`}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="flex h-11 w-11 items-center justify-center rounded-md text-negative hover:bg-negative-tint disabled:opacity-30"
        >
          <TrashIcon size={15} />
        </button>
        <Link
          href={`/people/${person.person_id}`}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-sunken hover:text-ink"
        >
          <ChevronRightIcon size={16} />
        </Link>
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
