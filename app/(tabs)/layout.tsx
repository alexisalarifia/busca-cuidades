import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import TabBar from "@/components/tab-bar";
import IngestButton from "@/components/ingest-button";
import OfflineBanner from "@/components/offline-banner";

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);
  if (!trip) redirect("/trip-gate");

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-28 pt-8">
      <OfflineBanner />
      {children}
      <IngestButton />
      <TabBar />
    </div>
  );
}
