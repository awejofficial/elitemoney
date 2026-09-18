import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewTransactionForm from "@/components/transactions/NewTransactionForm";
import TransactionRow, { type TransactionWithJoins } from "@/components/transactions/TransactionRow";
import { ArrowLeftIcon, LedgerIcon } from "@/components/icons";
import type { Account, Category } from "@/lib/supabase/database.types";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }, { data: transactions, error }] =
    await Promise.all([
      supabase.from("accounts").select("*").order("name") as unknown as Promise<{
        data: Account[] | null;
      }>,
      supabase.from("categories").select("*").order("name") as unknown as Promise<{
        data: Category[] | null;
      }>,
      supabase
        .from("transactions")
        .select("*, category:categories(name,icon,color), account:accounts(name)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200) as unknown as Promise<{
        data: TransactionWithJoins[] | null;
        error: { message: string } | null;
      }>,
    ]);

  const accountList = accounts ?? [];
  const categoryList = categories ?? [];
  const txList = transactions ?? [];

  const grouped = txList.reduce<Record<string, TransactionWithJoins[]>>((acc, tx) => {
    (acc[tx.date] ??= []).push(tx);
    return acc;
  }, {});

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink md:hidden"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <h1 className="flex items-center gap-2 font-display text-xl font-medium text-ink">
          <LedgerIcon size={20} className="text-palm" />
          Transactions
        </h1>
      </div>

      {error && <p className="text-sm text-negative">{error.message}</p>}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[360px_1fr] lg:items-start">
        {accountList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <p className="font-medium text-ink">Add an account first</p>
            <p className="text-sm text-muted">Transactions need an account to belong to.</p>
            <Link
              href="/accounts"
              className="rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper active:scale-95"
            >
              Go to accounts
            </Link>
          </div>
        ) : (
          <div className="lg:sticky lg:top-6">
            <NewTransactionForm accounts={accountList} categories={categoryList} defaultDate={date} />
          </div>
        )}

        {Object.keys(grouped).length > 0 ? (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([date, txs]) => (
              <div key={date} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted">
                  {new Date(date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                  {txs.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      accounts={accountList}
                      categories={categoryList}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          accountList.length > 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <p className="font-medium text-ink">No transactions yet</p>
              <p className="text-sm text-muted">Add your first income or expense above.</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
