import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewEntryForm from "@/components/people/NewEntryForm";
import EntryRow from "@/components/people/EntryRow";
import CountUpAmount from "@/components/CountUpAmount";
import { ArrowLeftIcon } from "@/components/icons";
import type { PersonBalance, LendingEntryOutstanding } from "@/lib/supabase/database.types";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const supabase = await createClient();

  const [{ data: person }, { data: entries, error }] = await Promise.all([
    supabase
      .from("person_balances")
      .select("*")
      .eq("person_id", personId)
      .maybeSingle() as unknown as Promise<{ data: PersonBalance | null }>,
    supabase
      .from("lending_entry_outstanding")
      .select("*")
      .eq("person_id", personId)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: LendingEntryOutstanding[] | null;
      error: { message: string } | null;
    }>,
  ]);

  if (!person) notFound();

  const entryList = entries ?? [];
  const label =
    person.net_balance > 0 ? "owes you" : person.net_balance < 0 ? "you owe" : "settled up";
  const color =
    person.net_balance > 0 ? "text-positive" : person.net_balance < 0 ? "text-negative" : "text-muted";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/people"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink md:hidden"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <h1 className="font-display text-xl font-medium text-ink">{person.name}</h1>
      </div>

      <section className={`flex flex-col items-start gap-1 rounded-2xl border border-border bg-surface p-6`}>
        <p className="text-sm text-muted">{label}</p>
        <CountUpAmount
          value={Math.abs(person.net_balance)}
          className={`font-amount text-3xl font-semibold ${color}`}
        />
      </section>

      {error && <p className="text-sm text-negative">{error.message}</p>}

      <NewEntryForm personId={personId} />

      {entryList.length > 0 ? (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {entryList.map((entry) => (
            <EntryRow key={entry.lending_entry_id} personId={personId} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="font-medium text-ink">No entries yet</p>
          <p className="text-sm text-muted">Log money lent or borrowed above.</p>
        </div>
      )}
    </main>
  );
}
