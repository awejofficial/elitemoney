"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="font-display text-xl font-medium text-ink">Check your email</h1>
        <p className="text-sm text-muted">
          We&apos;ve sent a password reset link to <strong className="text-ink">{email}</strong>.
          Click the link in that email to set a new password.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <Link
            href="/login"
            className="rounded-md bg-palm-strong px-3 py-2.5 text-sm font-medium text-paper transition active:scale-95"
          >
            Back to log in
          </Link>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="text-xs text-muted hover:text-ink hover:underline"
          >
            Didn&apos;t receive it? Try another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-medium text-ink">Forgot password</h1>
        <p className="text-xs text-muted">
          Enter the email associated with your account and we&apos;ll send you a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-muted">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
          />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-palm-strong px-3 py-2.5 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "Sending reset link…" : "Send reset link"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-palm-strong hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
