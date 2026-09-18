import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewRuleForm from "@/components/recurring/NewRuleForm";
import RuleRow, { type RuleWithJoins } from "@/components/recurring/RuleRow";
import { ArrowLeftIcon, CalendarIcon } from "@/components/icons";
import type { Account, Category } from "@/lib/supabase/database.types";

export default async function RecurringPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }, { data: rules, error }] = await Promise.all([
    supabase.from("accounts").select("*").order("name") as unknown as Promise<{
      data: Account[] | null;
    }>,
    supabase.from("categories").select("*").order("name") as unknown as Promise<{
      data: Category[] | null;
    }>,
    supabase
      .from("recurring_rules")
      .select("*, category:categories(name,icon,color), account:accounts(name)")
      .order("active", { ascending: false })
      .order("next_run_date") as unknown as Promise<{
      data: RuleWithJoins[] | null;
      error: { message: string } | null;
    }>,
  ]);

  const accountList = accounts ?? [];
  const categoryList = categories ?? [];
  const ruleList = rules ?? [];

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
          <CalendarIcon size={20} className="text-palm" />
          Recurring
        </h1>
      </div>

      {error && <p className="text-sm text-negative">{error.message}</p>}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[360px_1fr] lg:items-start">
        {accountList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <p className="font-medium text-ink">Add an account first</p>
            <p className="text-sm text-muted">Recurring rules need an account to belong to.</p>
            <Link
              href="/accounts"
              className="rounded-md bg-palm-strong px-4 py-2 text-sm font-medium text-paper active:scale-95"
            >
              Go to accounts
            </Link>
          </div>
        ) : (
          <div className="lg:sticky lg:top-6">
            <NewRuleForm accounts={accountList} categories={categoryList} />
          </div>
        )}

        {ruleList.length > 0 ? (
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {ruleList.map((rule) => (
              <RuleRow key={rule.id} rule={rule} accounts={accountList} categories={categoryList} />
            ))}
          </div>
        ) : (
          accountList.length > 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <p className="font-medium text-ink">No recurring rules yet</p>
              <p className="text-sm text-muted">
                Set up SIPs, EMIs, or chit funds to auto-add each month.
              </p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
