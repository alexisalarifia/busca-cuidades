"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "@/app/auth/actions";

const initial: AuthState = {};

export default function LoginForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [state, action, pending] = useActionState(authenticate, initial);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <input type="hidden" name="mode" value={mode} />
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="radius-token border border-ink/20 bg-white px-3 py-2 text-base outline-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          className="radius-token border border-ink/20 bg-white px-3 py-2 text-base outline-accent"
        />
      </label>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}
      {state.message && <p className="text-sm">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="radius-token shadow-hard mt-1 bg-accent px-4 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending
          ? "One moment…"
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        className="text-sm underline underline-offset-2"
      >
        {mode === "sign-in" ? "First time? Create the account" : "Back to sign in"}
      </button>
    </form>
  );
}
