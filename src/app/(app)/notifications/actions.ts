"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";

type SubscriptionJson = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function saveSubscription(sub: SubscriptionJson) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { error: error.message };
  return { error: null };
}

export async function removeSubscription(endpoint: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { error: error.message };
  return { error: null };
}

export async function sendTestNotification() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const result = await sendPushToUser(supabase, user.id, {
    title: "Test notification",
    body: "Push notifications are working on this device.",
    url: "/",
  });

  if (result.error) return { error: result.error };
  if (result.sent === 0) return { error: "No active subscription found on this device." };
  return { error: null };
}
