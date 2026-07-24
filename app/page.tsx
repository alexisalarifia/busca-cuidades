import LoginForm from "@/components/login-form";
import TrendsModule from "@/components/trends-module";

// Logged-out landing (brief §6): name, one line, login, Trends module below.
export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-8 px-6 pb-16 pt-24">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">BuscaCiudades</h1>
        <p className="text-ink/70">A pocket travel companion for Mexico City.</p>
      </header>

      <LoginForm />

      <TrendsModule />
    </main>
  );
}
