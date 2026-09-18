import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushSubscriptionRow } from "@/lib/supabase/database.types";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function configureWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

/** Sends `payload` to every push subscription the user has registered
 * (e.g. one per device/browser), dropping any subscription the push
 * service reports as gone (404/410 — user uninstalled, cleared data, etc). */
export async function sendPushToUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  payload: PushPayload,
) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return { sent: 0, error: "VAPID keys not configured" };
  }
  configureWebPush();

  const { data: subs } = (await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)) as { data: PushSubscriptionRow[] | null };

  if (!subs || subs.length === 0) return { sent: 0, error: null };

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      const body = (err as { body?: string }).body;
      console.error(`[push] send failed for subscription ${sub.id}:`, statusCode, body);
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  return { sent, error: null };
}
