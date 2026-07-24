import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import TripGateForm from "@/components/trip-gate-form";

export default async function TripGate() {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);
  if (trip) redirect("/today");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-6 pb-16 pt-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">New trip</h1>
        <p className="text-ink/70">
          Ninety seconds, three questions, and everything else hangs off this.
        </p>
      </header>
      <TripGateForm />
    </main>
  );
}
