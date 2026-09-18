import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "./send";
import type { LendingEntryOutstanding } from "@/lib/supabase/database.types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/**
 * Finds this user's lending entries due today or already overdue (and not
 * yet settled) and pushes one reminder per entry. Intended to run once a
 * day from the scheduled job (PRD §6.5) — see /api/cron/lending-reminders.
 */
export async function checkLendingDueReminders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
) {
  const todayIso = new Date().toLocaleDateString("en-CA");

  const { data: entries } = (await supabase
    .from("lending_entry_outstanding")
    .select("*, person:people(name)")
    .eq("user_id", userId)
    .neq("status", "settled")
    .lte("due_date", todayIso)
    .not("due_date", "is", null)) as {
    data: (LendingEntryOutstanding & { person: { name: string } | null })[] | null;
  };

  if (!entries || entries.length === 0) return;

  for (const entry of entries) {
    const isOverdue = entry.due_date! < todayIso;
    const who = entry.person?.name ?? "Someone";
    const verb = entry.direction === "lent" ? `${who} owes you` : `You owe ${who}`;
    const title = isOverdue ? "Overdue" : "Due today";

    await sendPushToUser(supabase, userId, {
      title: `${title}: ${currency.format(entry.outstanding_amount)}`,
      body: verb,
      url: "/people",
    });
  }
}
