"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { hasPin, verifyPin } from "@/lib/appLock/pin";
import { hasBiometricCredential, verifyBiometric } from "@/lib/appLock/biometric";
import { FingerprintIcon, LockIcon } from "@/components/icons";

type Stage = "checking" | "unlocked" | "locked";

export default function AppLockOverlay({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("checking");
  const [pinDraft, setPinDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);

  useEffect(() => {
    // localStorage only exists client-side, so this state can't be known
    // during SSR/first paint — reading it in an effect is the correct spot,
    // not a case the "no setState in effect" rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBiometricEnrolled(hasBiometricCredential());
    // PIN lock is opt-in (Security settings) — if the user hasn't set one
    // up on this device, there's nothing to gate.
    setStage(hasPin() ? "locked" : "unlocked");
  }, []);

  // Re-lock after the app has been backgrounded a while, so it's locked
  // again on next real "app open" per PRD §6.7 — but a quick tab switch or
  // alt-tab shouldn't force a re-unlock every time.
  const hiddenAtRef = useRef<number | null>(null);
  const RELOCK_AFTER_MS = 30_000;

  useEffect(() => {
    function handleVisibility() {
      if (!hasPin()) return;
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current !== null) {
        const elapsed = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (elapsed >= RELOCK_AFTER_MS) {
          setStage("locked");
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const tryBiometricUnlock = useCallback(async () => {
    setError(null);
    try {
      const ok = await verifyBiometric();
      if (ok) {
        setStage("unlocked");
      } else {
        setError("Biometric unlock failed. Use PIN instead.");
      }
    } catch {
      setError("Biometric unlock cancelled. Use PIN instead.");
    }
  }, []);

  useEffect(() => {
    if (stage !== "locked" || !biometricEnrolled) return;
    // WebAuthn prompt is an external-system side effect (OS biometric
    // sheet), not a plain state update, so it belongs here despite the lint
    // rule's general guidance against setState-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void tryBiometricUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function handleUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ok = await verifyPin(pinDraft);
    setPinDraft("");

    if (ok) {
      setStage("unlocked");
    } else {
      setError("Incorrect PIN.");
    }
  }

  if (stage === "checking") {
    return null;
  }

  if (stage === "unlocked") {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-paper p-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palm-strong text-paper">
        <LockIcon size={26} />
      </span>

      <form onSubmit={handleUnlockSubmit} className="flex w-full max-w-xs flex-col gap-3 text-center">
        <h1 className="font-display text-xl font-medium text-ink">Enter PIN</h1>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          minLength={4}
          maxLength={6}
          autoFocus
          value={pinDraft}
          onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ""))}
          className="rounded-md border border-border bg-surface px-3 py-3 text-center text-2xl tracking-[0.5em] text-ink outline-none focus:border-palm"
        />
        {error && <p className="text-sm text-negative">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-palm-strong px-3 py-2.5 text-sm font-medium text-paper transition active:scale-95"
        >
          Unlock
        </button>
        {biometricEnrolled && (
          <button
            type="button"
            onClick={tryBiometricUnlock}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-muted"
          >
            <FingerprintIcon size={16} />
            Use Face ID / Touch ID
          </button>
        )}
      </form>
    </div>
  );
}
