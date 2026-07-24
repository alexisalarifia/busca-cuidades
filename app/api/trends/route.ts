import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getTrends, TRENDS_TAG } from "@/lib/trends";

// Public (logged-out landing furniture, brief §6). GET returns the 7-day
// cached list; ?refresh=1 forces regeneration.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("refresh") === "1") {
    revalidateTag(TRENDS_TAG, "max");
  }
  try {
    const trends = await getTrends();
    return NextResponse.json(trends);
  } catch (e) {
    return NextResponse.json(
      { entries: [], updated: null, error: e instanceof Error ? e.message : "unavailable" },
      { status: 200 }
    );
  }
}
