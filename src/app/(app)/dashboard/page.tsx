import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CountUpAmount from "@/components/CountUpAmount";
import type { TransactionWithJoins } from "@/components/transactions/TransactionRow";
import { ChevronRightIcon, HandCoinsIcon, PlusIcon, WalletIcon } from "@/components/icons";
import type { AccountBalance, PersonBalance } from "@/lib/supabase/database.types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default async function Home() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: recentTx }, { data: people }] = await Promise.all([
    supabase.from("account_balances").select("*").order("name") as unknown as Promise<{
      data: AccountBalance[] | null;
    }>,
    supabase
      .from("transactions")
      .select("*, category:categories(name,icon,color), account:accounts(name)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5) as unknown as Promise<{ data: TransactionWithJoins[] | null }>,
    supabase.from("person_balances").select("*").order("name") as unknown as Promise<{
      data: PersonBalance[] | null;
    }>,
  ]);

  const totalBalance = (accounts ?? []).reduce((sum, a) => sum + a.balance, 0);
  const transactions = recentTx ?? [];
  const peopleWithBalance = (people ?? []).filter((p) => p.net_balance !== 0).slice(0, 3);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 sm:p-6">
      <section className="ledger-texture flex flex-col items-start gap-4 rounded-2xl bg-palm-strong p-7 text-paper">
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm text-paper/70">Total balance</p>
          <CountUpAmount
            value={totalBalance}
            className="font-amount text-4xl font-semibold sm:text-5xl"
          />
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1.5 rounded-md bg-paper px-4 py-2 text-sm font-medium text-palm-strong transition hover:brightness-95 active:scale-95"
        >
          <PlusIcon size={16} />
          Add transaction
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-medium text-ink">Recent</h2>
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-sm font-medium text-palm-strong hover:underline"
            >
              See all
              <ChevronRightIcon size={15} />
            </Link>
          </div>

          {transactions.length > 0 ? (
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-sunken"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                      style={{ backgroundColor: `${tx.category?.color ?? "#8b8262"}26` }}
                    >
                      {tx.category?.icon ?? "💰"}
                    </span>
                    <div>
                      <p className="font-medium text-ink">{tx.category?.name ?? "Uncategorized"}</p>
                      <p className="text-xs text-muted">{tx.account?.name}</p>
                    </div>
                  </div>
                  <span
                    className={`font-amount font-medium ${
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
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <p className="font-medium text-ink">No transactions yet</p>
              <p className="text-sm text-muted">Log your first income or expense to see it here.</p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-display text-lg font-medium text-ink">
              <HandCoinsIcon size={18} className="text-palm" />
              Lending
            </h2>
            <Link
              href="/people"
              className="flex items-center gap-1 text-sm font-medium text-palm-strong hover:underline"
            >
              See all
              <ChevronRightIcon size={15} />
            </Link>
          </div>

          {peopleWithBalance.length > 0 ? (
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {peopleWithBalance.map((person) => (
                <Link
                  key={person.person_id}
                  href={`/people/${person.person_id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-sunken"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-tint font-display text-sm font-medium text-palm-strong">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                    <p className="font-medium text-ink">{person.name}</p>
                  </div>
                  <span
                    className={`font-amount font-medium ${
                      person.net_balance > 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {currency.format(Math.abs(person.net_balance))}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
              <p className="text-sm text-muted">
                No open balances.{" "}
                <Link href="/people" className="font-medium text-palm-strong hover:underline">
                  Track money lent or borrowed
                </Link>
                .
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-medium text-ink">
            <WalletIcon size={18} className="text-palm" />
            Accounts
          </h2>
          <Link
            href="/accounts"
            className="flex items-center gap-1 text-sm font-medium text-palm-strong hover:underline"
          >
            Manage
            <ChevronRightIcon size={15} />
          </Link>
        </div>

        {accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <div
                key={account.account_id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-surface-sunken"
              >
                <div>
                  <p className="font-medium text-ink">{account.name}</p>
                  <p className="text-xs text-muted capitalize">{account.type}</p>
                </div>
                <span
                  className={`font-amount text-lg font-medium ${
                    account.balance < 0 ? "text-negative" : "text-ink"
                  }`}
                >
                  {currency.format(account.balance)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <WalletIcon size={28} className="text-mist" />
            <div>
              <p className="font-medium text-ink">No accounts yet</p>
              <p className="text-sm text-muted">
                Add your bank, cash, or wallet to start tracking balances.
              </p>
            </div>
            <Link
              href="/accounts"
              className="rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper active:scale-95"
            >
              Add your first account
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
