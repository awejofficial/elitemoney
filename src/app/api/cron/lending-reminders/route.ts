import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { checkLendingDueReminders } from "@/lib/push/lendingReminders";

/**
 * Trigger target for a once-daily scheduled job (PRD §6.5) that pushes
 * reminders for lending entries due today or overdue. Same deployment gap
 * as /api/cron/recurring — inert until SUPABASE_SERVICE_ROLE_KEY and
 * CRON_SECRET exist as real env vars (Module 10 deployment phase). Use the
 * "Send test notification" button on /notifications to verify push
 * delivery itself works today, independent of this route.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: subs } = await supabase.from("push_subscriptions").select("user_id");
  const uniqueUserIds = [...new Set((subs ?? []).map((s) => s.user_id))];

  for (const userId of uniqueUserIds) {
    await checkLendingDueReminders(supabase, userId);
  }

  return NextResponse.json({ processed: uniqueUserIds.length });
}
