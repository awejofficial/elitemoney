import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CategoryDonut, { type CategorySlice } from "@/components/reports/CategoryDonut";
import TrendChart, { type MonthTotals } from "@/components/reports/TrendChart";
import MonthCalendar from "@/components/reports/MonthCalendar";
import type { TransactionWithJoins } from "@/components/transactions/TransactionRow";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/icons";

const TREND_MONTHS = 6;

function parseMonth(param: string | undefined): { year: number; monthIndex: number } {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function monthParam(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const { year, monthIndex } = parseMonth(m);

  const rangeStart = new Date(year, monthIndex - (TREND_MONTHS - 1), 1);
  const rangeEnd = new Date(year, monthIndex + 1, 1);
  const rangeStartIso = rangeStart.toLocaleDateString("en-CA");
  const rangeEndIso = rangeEnd.toLocaleDateString("en-CA");

  const supabase = await createClient();
  const { data: rangeTx } = (await supabase
    .from("transactions")
    .select("*, category:categories(name,icon,color), account:accounts(name)")
    .gte("date", rangeStartIso)
    .lt("date", rangeEndIso)
    .order("date")) as { data: TransactionWithJoins[] | null };

  const allTx = rangeTx ?? [];

  const monthStartIso = new Date(year, monthIndex, 1).toLocaleDateString("en-CA");
  const monthEndIso = new Date(year, monthIndex + 1, 1).toLocaleDateString("en-CA");
  const monthTx = allTx.filter((tx) => tx.date >= monthStartIso && tx.date < monthEndIso);

  const categoryTotalsByType = (type: "income" | "expense") => {
    const map = new Map<string, CategorySlice>();
    for (const tx of monthTx) {
      if (tx.type !== type || !tx.category) continue;
      const existing = map.get(tx.category_id);
      if (existing) {
        existing.amount += tx.amount;
      } else {
        map.set(tx.category_id, {
          categoryId: tx.category_id,
          name: tx.category.name,
          icon: tx.category.icon,
          color: tx.category.color,
          amount: tx.amount,
        });
      }
    }
    return [...map.values()];
  };

  const expenseSlices = categoryTotalsByType("expense");
  const incomeSlices = categoryTotalsByType("income");
  const expenseTotal = expenseSlices.reduce((s, c) => s + c.amount, 0);
  const incomeTotal = incomeSlices.reduce((s, c) => s + c.amount, 0);

  const months: MonthTotals[] = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const mi = monthIndex - (TREND_MONTHS - 1) + i;
    const d = new Date(year, mi, 1);
    const startIso = d.toLocaleDateString("en-CA");
    const endIso = new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString("en-CA");
    const inMonth = allTx.filter((tx) => tx.date >= startIso && tx.date < endIso);
    return {
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      income: inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  const prevMonth = new Date(year, monthIndex - 1, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);
  const isCurrentMonth =
    year === new Date().getFullYear() && monthIndex === new Date().getMonth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink md:hidden"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <h1 className="font-display text-xl font-medium text-ink">Reports</h1>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/reports?m=${monthParam(prevMonth.getFullYear(), prevMonth.getMonth())}`}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <p className="font-display text-lg font-medium text-ink">
          {new Date(year, monthIndex, 1).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <Link
          href={`/reports?m=${monthParam(nextMonth.getFullYear(), nextMonth.getMonth())}`}
          aria-disabled={isCurrentMonth}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink ${
            isCurrentMonth ? "pointer-events-none opacity-30" : ""
          }`}
        >
          <ChevronRightIcon size={16} />
        </Link>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium text-muted">Spending by category</h2>
        <CategoryDonut slices={expenseSlices} total={expenseTotal} />
      </section>

      {incomeTotal > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-medium text-muted">Income by category</h2>
          <CategoryDonut slices={incomeSlices} total={incomeTotal} />
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium text-muted">Last {TREND_MONTHS} months</h2>
        <TrendChart months={months} />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium text-muted">Calendar</h2>
        <MonthCalendar year={year} monthIndex={monthIndex} transactions={monthTx} />
      </section>
    </main>
  );
}
