"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
} from "@/lib/push/client";
import { saveSubscription, removeSubscription, sendTestNotification } from "./actions";
import { ArrowLeftIcon, BellIcon } from "@/components/icons";

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

export default function NotificationsPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isPushSupported()) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        // Make sure a service worker registration exists before waiting on
        // `.ready` below — `.ready` never resolves if nothing ever calls
        // register(), which otherwise leaves this screen stuck on
        // "checking" forever with no visible content.
        if (!(await navigator.serviceWorker.getRegistration())) {
          await navigator.serviceWorker.register("/sw.js");
        }

        const existing = await Promise.race([
          getExistingSubscription(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);

        if (existing) {
          // The browser can hold a subscription the DB row for doesn't
          // exist for anymore (e.g. it was created before the migration
          // ran, or the row got deleted) — re-save it so the two stay in
          // sync instead of showing "on" with nothing to actually send to.
          const result = await saveSubscription(
            existing.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } },
          );
          if (result.error) {
            setError(result.error);
            setStatus("off");
            return;
          }
        }

        setStatus(existing ? "on" : "off");
      } catch {
        setStatus("unsupported");
      }
    })();
  }, []);

  async function handleEnable() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const sub = await subscribeToPush();
      const result = await saveSubscription(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("on");
    } catch {
      setError("Couldn't enable notifications on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const sub = await unsubscribeFromPush();
      if (sub) await removeSubscription(sub.endpoint);
      setStatus("off");
    } catch {
      setError("Couldn't disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setError(null);
    setMessage(null);
    setBusy(true);
    const result = await sendTestNotification();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Sent — check your notifications.");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink md:hidden"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <h1 className="flex items-center gap-2 font-display text-xl font-medium text-ink">
          <BellIcon size={20} className="text-palm" />
          Notifications
        </h1>
      </div>

      <p className="text-sm text-muted">
        Get a reminder when someone&apos;s repayment is due or overdue. Off by default.
      </p>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        {status === "checking" && <p className="text-sm text-muted">Checking…</p>}

        {status === "unsupported" && (
          <p className="text-sm text-muted">
            Notifications aren&apos;t supported in this browser. On iPhone, add this app to your
            Home Screen first (Share → Add to Home Screen), then open it from there.
          </p>
        )}

        {status === "denied" && (
          <p className="text-sm text-negative">
            Notifications are blocked for this app. Re-enable them in your browser/device
            settings to turn this on.
          </p>
        )}

        {(status === "off" || status === "on") && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">Due-date reminders</p>
              <p className="text-sm text-muted">{status === "on" ? "On for this device" : "Off"}</p>
            </div>
            {status === "on" ? (
              <button
                onClick={handleDisable}
                disabled={busy}
                className="rounded-md border border-negative/30 px-3 py-1.5 text-sm text-negative disabled:opacity-50"
              >
                Turn off
              </button>
            ) : (
              <button
                onClick={handleEnable}
                disabled={busy}
                className="rounded-md bg-palm-strong px-3 py-1.5 text-sm font-medium text-paper active:scale-95 disabled:opacity-50"
              >
                Turn on
              </button>
            )}
          </div>
        )}

        {status === "on" && (
          <button
            onClick={handleTest}
            disabled={busy}
            className="w-fit rounded-md border border-border px-3 py-1.5 text-sm text-ink disabled:opacity-50"
          >
            Send test notification
          </button>
        )}

        {error && <p className="text-sm text-negative">{error}</p>}
        {message && <p className="text-sm text-positive">{message}</p>}
      </section>
    </main>
  );
}
