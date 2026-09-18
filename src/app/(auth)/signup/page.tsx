"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/icons";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleGoogleSignUp() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is off in Supabase settings, session comes
    // back immediately and user is already logged in; if on, they need
    // to confirm via email before signing in.
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="font-display text-xl font-medium text-ink">Check your email</h1>
        <p className="text-sm text-muted">
          Confirm your address, then{" "}
          <Link href="/login" className="font-medium text-palm-strong hover:underline">
            log in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <h1 className="font-display text-xl font-medium text-ink">Sign up</h1>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-sunken active:scale-[0.99] disabled:opacity-50"
      >
        <GoogleIcon size={18} />
        {googleLoading ? "Connecting to Google…" : "Continue with Google"}
      </button>

      <div className="relative my-1 flex items-center justify-center">
        <div className="w-full border-t border-border" />
        <span className="absolute bg-surface px-2 text-xs uppercase tracking-wider text-muted">
          or
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
          />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="rounded-md bg-palm-strong px-3 py-2.5 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "Signing up…" : "Sign up with email"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Have an account?{" "}
        <Link href="/login" className="font-medium text-palm-strong hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-xl border border-border bg-surface p-6" />}>
      <SignupForm />
    </Suspense>
  );
}
