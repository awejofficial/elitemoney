import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CategoryRow from "@/components/categories/CategoryRow";
import NewCategoryForm from "@/components/categories/NewCategoryForm";
import { ArrowLeftIcon, TagIcon } from "@/components/icons";
import type { Category } from "@/lib/supabase/database.types";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories, error } = (await supabase
    .from("categories")
    .select("*")
    .order("name")) as { data: Category[] | null; error: { message: string } | null };

  const income = (categories ?? []).filter((c) => c.type === "income");
  const expense = (categories ?? []).filter((c) => c.type === "expense");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink md:hidden"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <h1 className="flex items-center gap-2 font-display text-xl font-medium text-ink">
          <TagIcon size={20} className="text-palm" />
          Categories
        </h1>
      </div>

      {error && <p className="text-sm text-negative">{error.message}</p>}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">Income</h2>
        {income.length > 0 ? (
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface md:grid md:grid-cols-2 md:gap-2 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent lg:grid-cols-3">
            {income.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No income categories yet.</p>
        )}
        <NewCategoryForm type="income" />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">Expense</h2>
        {expense.length > 0 ? (
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface md:grid md:grid-cols-2 md:gap-2 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent lg:grid-cols-3">
            {expense.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No expense categories yet.</p>
        )}
        <NewCategoryForm type="expense" />
      </section>
    </main>
  );
}
