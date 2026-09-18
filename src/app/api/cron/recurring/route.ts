import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { runDueRecurringRules } from "@/lib/recurring";

/**
 * Trigger target for the scheduled job from PRD §6.4 (Vercel Cron /
 * Supabase pg_cron). Not wired up yet — that happens in the deployment
 * phase, once SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET exist as real env
 * vars. Until then, `runDueRecurringRules` also runs opportunistically on
 * every app load (see (app)/layout.tsx), which is enough to test recurring
 * rules today.
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

  const { data: users } = await supabase
    .from("recurring_rules")
    .select("user_id")
    .eq("active", true);

  const uniqueUserIds = [...new Set((users ?? []).map((u) => u.user_id))];

  for (const userId of uniqueUserIds) {
    await runDueRecurringRules(supabase, userId);
  }

  return NextResponse.json({ processed: uniqueUserIds.length });
}
