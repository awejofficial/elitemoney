"use client";

import { useEffect, useRef } from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "@/components/icons";

export type MonthTotals = {
  label: string;
  income: number;
  expense: number;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const CHART_HEIGHT = 140;

export default function TrendChart({ months }: { months: MonthTotals[] }) {
  const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [months]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <ArrowUpRightIcon size={13} className="text-positive" />
          Income
        </span>
        <span className="flex items-center gap-1">
          <ArrowDownRightIcon size={13} className="text-negative" />
          Expense
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex items-end gap-3 overflow-x-auto pr-6"
        style={{ height: CHART_HEIGHT + 40 }}
      >
        {months.map((m) => {
          const incomeHeight = (m.income / max) * CHART_HEIGHT;
          const expenseHeight = (m.expense / max) * CHART_HEIGHT;

          return (
            <div key={m.label} className="flex shrink-0 flex-col items-center gap-1.5" style={{ width: 52 }}>
              <div className="flex items-end gap-1" style={{ height: CHART_HEIGHT }}>
                <div className="flex flex-col items-center justify-end gap-1" style={{ height: CHART_HEIGHT }}>
                  {m.income > 0 && (
                    <span className="whitespace-nowrap text-[10px] text-positive">
                      {currency.format(m.income)}
                    </span>
                  )}
                  <div
                    className="w-3.5 rounded-t-sm bg-positive"
                    style={{ height: Math.max(incomeHeight, m.income > 0 ? 3 : 0) }}
                  />
                </div>
                <div className="flex flex-col items-center justify-end gap-1" style={{ height: CHART_HEIGHT }}>
                  {m.expense > 0 && (
                    <span className="whitespace-nowrap text-[10px] text-negative">
                      {currency.format(m.expense)}
                    </span>
                  )}
                  <div
                    className="w-3.5 rounded-t-sm bg-negative"
                    style={{ height: Math.max(expenseHeight, m.expense > 0 ? 3 : 0) }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
