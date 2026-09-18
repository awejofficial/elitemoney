import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PersonRow from "@/components/people/PersonRow";
import NewPersonForm from "@/components/people/NewPersonForm";
import { ArrowLeftIcon, HandCoinsIcon } from "@/components/icons";
import type { PersonBalance } from "@/lib/supabase/database.types";

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: people, error } = (await supabase
    .from("person_balances")
    .select("*")
    .order("name")) as { data: PersonBalance[] | null; error: { message: string } | null };

  const peopleList = people ?? [];

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
          <HandCoinsIcon size={20} className="text-palm" />
          Lending
        </h1>
      </div>

      {error && <p className="text-sm text-negative">{error.message}</p>}

      {peopleList.length > 0 ? (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {peopleList.map((person) => (
            <PersonRow key={person.person_id} person={person} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <HandCoinsIcon size={28} className="text-mist" />
          <p className="font-medium text-ink">No one here yet</p>
          <p className="text-sm text-muted">Add a person to start tracking money lent or borrowed.</p>
        </div>
      )}

      <NewPersonForm />
    </main>
  );
}
