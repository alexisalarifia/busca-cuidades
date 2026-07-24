"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/today");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Allowlist of one (brief §5). The DB trigger is the backstop; this is the
  // front door.
  const allowed = (process.env.ALLOWED_USER_EMAIL ?? "").toLowerCase();
  if (!allowed || email !== allowed) {
    return { error: "Signups are closed." };
  }
  if (password.length < 8) {
    return { error: "Password needs at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.session) redirect("/today");
  return { message: "Check your email for a confirmation link, then sign in." };
}

// Single action for the login form: useActionState doesn't rebind when the
// action prop changes, so the form posts its mode instead of swapping actions.
export async function authenticate(
  prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  return formData.get("mode") === "sign-up"
    ? signUp(prev, formData)
    : signIn(prev, formData);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
