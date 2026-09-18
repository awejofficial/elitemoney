"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <h1 className="font-display text-xl font-medium text-ink">Log in</h1>

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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-palm"
        />
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-palm-strong px-3 py-2.5 text-sm font-medium text-paper transition active:scale-95 disabled:opacity-50"
      >
        {loading ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-palm-strong hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
