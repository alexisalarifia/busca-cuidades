import LoginForm from "@/components/login-form";

// Logged-out landing (brief §6): name, one line, login, Trends module below.
// The Trends module itself arrives in M4; its frame is here from day one.
export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-8 px-6 pb-16 pt-24">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">BuscaCiudades</h1>
        <p className="text-ink/70">A pocket travel companion for Mexico City.</p>
      </header>

      <LoginForm />

      <section className="radius-token mt-8 w-full border border-ink/10 bg-white p-4">
        <h2 className="font-semibold">Top things to do in Mexico City</h2>
        <p className="mt-2 text-sm text-ink/60">
          Fresh picks land here with an upcoming build.
        </p>
        <p className="tnum mt-3 text-xs text-ink/40">Updated —</p>
      </section>
    </main>
  );
}
