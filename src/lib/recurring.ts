import type { SupabaseClient } from "@supabase/supabase-js";

function toIso(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function clampDay(year: number, monthIndex: number, day: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, daysInMonth);
}

/** First date >= `after` (inclusive) whose day-of-month is `dayOfMonth`. */
export function computeNextRunDate(dayOfMonth: number, after = new Date()): string {
  const year = after.getFullYear();
  const monthIndex = after.getMonth();
  const thisMonth = new Date(year, monthIndex, clampDay(year, monthIndex, dayOfMonth));

  if (thisMonth >= new Date(after.toDateString())) {
    return toIso(thisMonth);
  }

  const nextMonth = new Date(year, monthIndex + 1, clampDay(year, monthIndex + 1, dayOfMonth));
  return toIso(nextMonth);
}

/** The occurrence one calendar month after `current` (same day-of-month, clamped). */
function advanceOneMonth(current: string, dayOfMonth: number): string {
  const [y, m] = current.split("-").map(Number);
  const nextMonthIndex = m; // current m is 1-based month, so m == next month's 0-based index
  const next = new Date(y, nextMonthIndex, clampDay(y, nextMonthIndex, dayOfMonth));
  return toIso(next);
}

type RecurringRule = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: "income" | "expense";
  amount: number;
  day_of_month: number | null;
  note: string | null;
  next_run_date: string;
  active: boolean;
};

/**
 * Auto-adds any transactions whose recurring rule is due (next_run_date <=
 * today), then advances each rule to its next occurrence. Safe to call on
 * every app load — a no-op when nothing is due. Standing in for the
 * Vercel Cron / pg_cron job from the PRD until deployment is wired up.
 */
export async function runDueRecurringRules(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
) {
  const todayIso = toIso(new Date());

  const { data: dueRules } = (await supabase
    .from("recurring_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .lte("next_run_date", todayIso)) as { data: RecurringRule[] | null };

  if (!dueRules || dueRules.length === 0) return;

  for (const rule of dueRules) {
    let occurrence = rule.next_run_date;
    const dayOfMonth = rule.day_of_month ?? Number(rule.next_run_date.split("-")[2]);
    let iterations = 0;

    // Catch up on every missed occurrence (e.g. app not opened for months),
    // not just the most recent one.
    while (occurrence <= todayIso && iterations < 24) {
      await supabase.from("transactions").insert({
        user_id: rule.user_id,
        account_id: rule.account_id,
        category_id: rule.category_id,
        type: rule.type,
        amount: rule.amount,
        date: occurrence,
        note: rule.note,
        recurring_rule_id: rule.id,
      });

      occurrence = advanceOneMonth(occurrence, dayOfMonth);
      iterations += 1;
    }

    await supabase.from("recurring_rules").update({ next_run_date: occurrence }).eq("id", rule.id);
  }
}
