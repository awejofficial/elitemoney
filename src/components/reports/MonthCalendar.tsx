"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import type { TransactionWithJoins } from "@/components/transactions/TransactionRow";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function MonthCalendar({
  year,
  monthIndex,
  transactions,
}: {
  year: number;
  monthIndex: number;
  transactions: TransactionWithJoins[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const byDate = transactions.reduce<Record<string, TransactionWithJoins[]>>((acc, tx) => {
    (acc[tx.date] ??= []).push(tx);
    return acc;
  }, {});

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedTx = selected ? (byDate[selected] ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i} className="text-xs text-muted">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;

          const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTx = byDate[iso];
          const isSelected = selected === iso;

          return (
            <button
              key={iso}
              onClick={() => setSelected(isSelected ? null : iso)}
              className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-sm transition ${
                isSelected ? "bg-palm-strong text-paper" : "text-ink hover:bg-surface-sunken"
              }`}
            >
              {day}
              <span
                className={`h-1 w-1 rounded-full ${
                  dayTx ? (isSelected ? "bg-paper" : "bg-palm") : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {new Date(selected).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </p>
            <Link
              href={`/transactions?date=${selected}`}
              className="flex items-center gap-1 text-xs font-medium text-palm-strong hover:underline"
            >
              <PlusIcon size={13} />
              Add
            </Link>
          </div>

          {selectedTx.length > 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {selectedTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <span>{tx.category?.icon ?? "💰"}</span>
                    {tx.category?.name ?? "Uncategorized"}
                  </span>
                  <span
                    className={`font-amount text-sm font-medium ${
                      tx.type === "income" ? "text-positive" : "text-negative"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "−"}
                    {currency.format(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Nothing logged this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
