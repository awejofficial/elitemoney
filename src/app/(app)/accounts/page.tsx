import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountRow from "@/components/accounts/AccountRow";
import NewAccountForm from "@/components/accounts/NewAccountForm";
import { ArrowLeftIcon, WalletIcon } from "@/components/icons";
import type { AccountBalance } from "@/lib/supabase/database.types";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts, error } = await supabase
    .from("account_balances")
    .select("*")
    .order("name") as { data: AccountBalance[] | null; error: { message: string } | null };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink md:hidden"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <h1 className="flex items-center gap-2 font-display text-xl font-medium text-ink">
          <WalletIcon size={20} className="text-palm" />
          Accounts
        </h1>
      </div>

      {error && <p className="text-sm text-negative">{error.message}</p>}

      <div className="flex flex-col gap-2">
        {accounts && accounts.length > 0 ? (
          accounts.map((account) => <AccountRow key={account.account_id} account={account} />)
        ) : (
          <p className="text-sm text-muted">No accounts yet. Add one below.</p>
        )}
      </div>

      <NewAccountForm />
    </main>
  );
}
