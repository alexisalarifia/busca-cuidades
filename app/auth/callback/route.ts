import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here after email confirmation / recovery with a PKCE
// `code`. Without this exchange the link lands on a page that can't finish
// signing you in.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Expired or already-used link: the account may still be confirmed, so send
  // them to sign in rather than to an error page.
  return NextResponse.redirect(`${origin}/?confirmed=1`);
}
