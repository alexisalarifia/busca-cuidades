import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { signOut } from "@/app/auth/actions";
import { archiveTrip } from "./actions";
import ImportPlacesForm from "@/components/import-places-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const trip = await getActiveTrip(supabase);

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ask_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", hourAgo);
  const limit = Number(process.env.ASK_RATE_LIMIT_PER_HOUR ?? 5);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <section className="radius-token border border-ink/10 bg-white p-4">
        <p className="text-sm text-ink/60">Signed in as</p>
        <p className="font-medium">{user?.email}</p>
      </section>

      <section className="radius-token border border-ink/10 bg-white p-4">
        <p className="text-sm text-ink/60">Ask usage this hour</p>
        <p className="tnum font-medium">
          {count ?? 0} of {limit}
        </p>
      </section>

      <section className="radius-token border border-ink/10 bg-white p-4">
        <p className="mb-2 text-sm font-semibold">Import places</p>
        <ImportPlacesForm />
      </section>

      <section className="radius-token flex flex-col gap-3 border border-ink/10 bg-white p-4">
        <p className="text-sm text-ink/60">Trip</p>
        <p className="font-medium">{trip?.name}</p>
        <button
          disabled
          className="radius-token border border-ink/20 px-4 py-2 text-left text-sm opacity-50"
        >
          Export trip — arrives with a later build
        </button>
        <form action={archiveTrip}>
          <button className="radius-token w-full border border-ink/20 px-4 py-2 text-left text-sm">
            Archive this trip
          </button>
        </form>
      </section>

      <form action={signOut}>
        <button className="radius-token w-full border border-ink/20 px-4 py-2 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
