"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { hasPin, setPin, verifyPin, clearPin } from "@/lib/appLock/pin";
import {
  isBiometricAvailable,
  hasBiometricCredential,
  registerBiometric,
  clearBiometricCredential,
} from "@/lib/appLock/biometric";
import { ArrowLeftIcon, FingerprintIcon, LockIcon } from "@/components/icons";

type PinPanel = "idle" | "create" | "confirm-create" | "verify-to-remove" | "verify-to-change" | "change-new";

export default function SecurityPage() {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);

  const [panel, setPanel] = useState<PinPanel>("idle");
  const [draft, setDraft] = useState("");
  const [firstDraft, setFirstDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refreshStatus() {
    setPinEnabled(hasPin());
    setBiometricEnrolled(hasBiometricCredential());
  }

  useEffect(() => {
    // localStorage-backed status can't be known during SSR/first paint, so
    // reading it in an effect is correct here, not a case this rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStatus();
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  function resetPanel() {
    setPanel("idle");
    setDraft("");
    setFirstDraft("");
    setError(null);
  }

  async function handlePanelSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (draft.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }

    if (panel === "create") {
      setFirstDraft(draft);
      setDraft("");
      setPanel("confirm-create");
      return;
    }

    if (panel === "confirm-create") {
      if (draft !== firstDraft) {
        setError("PINs didn't match. Try again.");
        setDraft("");
        setFirstDraft("");
        setPanel("create");
        return;
      }
      await setPin(draft);
      refreshStatus();
      resetPanel();
      return;
    }

    if (panel === "verify-to-remove") {
      const ok = await verifyPin(draft);
      if (!ok) {
        setError("Incorrect PIN.");
        setDraft("");
        return;
      }
      clearPin();
      clearBiometricCredential();
      refreshStatus();
      resetPanel();
      return;
    }

    if (panel === "verify-to-change") {
      const ok = await verifyPin(draft);
      if (!ok) {
        setError("Incorrect PIN.");
        setDraft("");
        return;
      }
      setDraft("");
      setPanel("change-new");
      return;
    }

    if (panel === "change-new") {
      await setPin(draft);
      refreshStatus();
      resetPanel();
    }
  }

  async function handleEnableBiometric() {
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session");

      await registerBiometric(user.id, user.email ?? user.id);
      refreshStatus();
    } catch {
      setError("Couldn't enable biometric unlock.");
    }
  }

  function handleDisableBiometric() {
    clearBiometricCredential();
    refreshStatus();
  }

  const panelCopy: Record<Exclude<PinPanel, "idle">, { title: string; cta: string }> = {
    create: { title: "Create a PIN", cta: "Next" },
    "confirm-create": { title: "Confirm your PIN", cta: "Turn on PIN lock" },
    "verify-to-remove": { title: "Enter current PIN to turn off", cta: "Turn off PIN lock" },
    "verify-to-change": { title: "Enter current PIN", cta: "Next" },
    "change-new": { title: "Enter new PIN", cta: "Save new PIN" },
  };

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
          <LockIcon size={20} className="text-palm" />
          Security
        </h1>
      </div>

      <p className="text-sm text-muted">
        Optional PIN or biometric lock on this device, on top of your account login. Off by
        default — nothing is required to use the app.
      </p>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-ink">PIN lock</p>
            <p className="text-sm text-muted">{pinEnabled ? "On for this device" : "Off"}</p>
          </div>
          {panel === "idle" &&
            (pinEnabled ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setPanel("verify-to-change")}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-ink"
                >
                  Change
                </button>
                <button
                  onClick={() => setPanel("verify-to-remove")}
                  className="rounded-md border border-negative/30 px-3 py-1.5 text-sm text-negative"
                >
                  Turn off
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPanel("create")}
                className="rounded-md bg-palm-strong px-3 py-1.5 text-sm font-medium text-paper active:scale-95"
              >
                Turn on
              </button>
            ))}
        </div>

        {panel !== "idle" && (
          <form onSubmit={handlePanelSubmit} className="flex flex-col gap-2 border-t border-border pt-3">
            <label className="text-sm text-muted">{panelCopy[panel].title}</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={4}
              maxLength={6}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
              className="rounded-md border border-border bg-surface px-3 py-2 text-center text-lg tracking-[0.4em] text-ink outline-none focus:border-palm"
            />
            {error && <p className="text-sm text-negative">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-palm-strong px-3 py-2 text-sm font-medium text-paper active:scale-95"
              >
                {panelCopy[panel].cta}
              </button>
              <button
                type="button"
                onClick={resetPanel}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {pinEnabled && biometricAvailable && (
        <section className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <FingerprintIcon size={18} className="text-palm" />
            <div>
              <p className="font-medium text-ink">Face ID / Touch ID</p>
              <p className="text-sm text-muted">
                {biometricEnrolled ? "Enabled as a shortcut for your PIN" : "Off"}
              </p>
            </div>
          </div>
          {biometricEnrolled ? (
            <button
              onClick={handleDisableBiometric}
              className="rounded-md border border-negative/30 px-3 py-1.5 text-sm text-negative"
            >
              Turn off
            </button>
          ) : (
            <button
              onClick={handleEnableBiometric}
              className="rounded-md bg-palm-strong px-3 py-1.5 text-sm font-medium text-paper active:scale-95"
            >
              Turn on
            </button>
          )}
        </section>
      )}
    </main>
  );
}
